// Deterministic graders per docs/specs/graders.md. Reads the attempt's
// transcript, the task, the fixture map, the pre-attempt id snapshot,
// and the live workspace; produces one grade record. No LLM calls
// anywhere. Grading runs after the agent finishes and before teardown,
// so the workspace still holds whatever the agent did.

import { TEAM_MENTION_NAME } from "./baseline.js";
import type { Fixture } from "./setup.js";
import { substituteRun } from "./setup.js";
import {
	fetchStoryFull,
	fetchTeamStories,
	type LiveStoryFull,
} from "./shortcut.js";
import type { GoldenTask } from "./tasks.js";
import { loadVocabulary, type Vocabulary } from "./vocabulary.js";
import { createLiveWorkspace, type Workspace } from "./workspace.js";

export type TranscriptEvent = Record<string, unknown> & { type: string };

export type Receipt = { endpoint: string; at: string };

export type CheckResult = {
	kind: string;
	ok: boolean;
	details: Record<string, unknown>;
	receipts: Receipt[];
};

export type Measurements = {
	turns: number;
	tool_calls_total: number;
	tool_calls_by_name: Record<string, number>;
	invalid_tool_calls: number;
	input_tokens: number;
	output_tokens: number;
	wall_ms: number;
	tools_called: string[];
	tools_expected: string[] | null;
	expected_tools_only: boolean | null;
	stop_reason: string | null;
};

export type GradeRecord = {
	type: "grade";
	status: "pass" | "fail" | "ungraded";
	reason?: string;
	checks: CheckResult[];
	measurements: Measurements;
	at: string;
};

export type GradeInputs = {
	task: GoldenTask;
	events: TranscriptEvent[];
	fixtures: Fixture[];
	preIds: Set<number>;
	postIds: Set<number>;
	runStamp: string;
	laneId: string;
	token: string;
};

// Extraction rule: find sequences of digits, optionally preceded by
// "sc-". Ambiguity (extra numbers appearing beyond the answer set) is
// left to compare-as-set to catch: if the extraction returns anything
// the expected set doesn't contain, the check fails.
const ID_RE = /(?:sc-)?(\d+)/gi;

export function extractIds(answer: string): Set<number> {
	const out = new Set<number>();
	for (const m of answer.matchAll(ID_RE)) {
		out.add(Number(m[1]));
	}
	return out;
}

function eqSet<T>(a: Set<T>, b: Set<T>): boolean {
	if (a.size !== b.size) return false;
	for (const x of a) if (!b.has(x)) return false;
	return true;
}

export function casingEqual(
	a: string,
	b: string,
	casing: "insensitive" | "exact",
): boolean {
	return casing === "exact" ? a === b : a.toLowerCase() === b.toLowerCase();
}

function casingContains(
	haystack: string,
	needle: string,
	casing: "insensitive" | "exact",
): boolean {
	return casing === "exact"
		? haystack.includes(needle)
		: haystack.toLowerCase().includes(needle.toLowerCase());
}

function taskCasing(task: GoldenTask): "insensitive" | "exact" {
	return task.tolerances?.casing ?? "insensitive";
}

// Extract the calendar date the given instant falls on when read in a
// timezone. Uses en-CA which formats as YYYY-MM-DD.
export function calendarDateInTimezone(iso: string, timezone: string): string {
	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone: timezone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).formatToParts(new Date(iso));
	const y = parts.find((p) => p.type === "year")?.value ?? "";
	const m = parts.find((p) => p.type === "month")?.value ?? "";
	const d = parts.find((p) => p.type === "day")?.value ?? "";
	return `${y}-${m}-${d}`;
}

function finalAnswer(events: TranscriptEvent[]): string {
	const fa = [...events]
		.reverse()
		.find(
			(e): e is TranscriptEvent & { text: string } => e.type === "final_answer",
		);
	return fa?.text ?? "";
}

function toolCalls(events: TranscriptEvent[]): string[] {
	const out: string[] = [];
	for (const ev of events) {
		if (ev.type === "tool_result" || ev.type === "tool_error") {
			const name = (ev as { name?: string }).name;
			if (name) out.push(name);
		}
	}
	return out;
}

function invalidToolCallCount(events: TranscriptEvent[]): number {
	let n = 0;
	for (const ev of events) {
		if (ev.type === "tool_error") n++;
		else if (ev.type === "tool_result") {
			if ((ev as { is_error?: boolean }).is_error) n++;
		}
	}
	return n;
}

function computeMeasurements(
	events: TranscriptEvent[],
	task: GoldenTask,
	laneId: string,
): Measurements {
	const meta = events.find((e) => e.type === "meta.start");
	const finalAns = events.find((e) => e.type === "final_answer") as
		| {
				turns?: number;
				stop_reason?: string | null;
				input_tokens?: number;
				output_tokens?: number;
		  }
		| undefined;
	const start = meta
		? Date.parse((meta as { started_at?: string }).started_at ?? "")
		: 0;
	const endEv = events.find((e) => e.type === "final_answer") as
		| { at?: string }
		| undefined;
	const end = endEv?.at ? Date.parse(endEv.at) : 0;
	const called = toolCalls(events);
	const byName: Record<string, number> = {};
	for (const n of called) byName[n] = (byName[n] ?? 0) + 1;
	const expected = task.expected_tools?.[laneId];
	let expectedOnly: boolean | null = null;
	if (expected !== undefined) {
		const expectedSet = new Set(expected);
		expectedOnly = called.every((n) => expectedSet.has(n));
	}
	return {
		turns: finalAns?.turns ?? 0,
		tool_calls_total: called.length,
		tool_calls_by_name: byName,
		invalid_tool_calls: invalidToolCallCount(events),
		input_tokens: finalAns?.input_tokens ?? 0,
		output_tokens: finalAns?.output_tokens ?? 0,
		wall_ms: start && end ? end - start : 0,
		tools_called: called,
		tools_expected: expected ?? null,
		expected_tools_only: expectedOnly,
		stop_reason: finalAns?.stop_reason ?? null,
	};
}

// Harvest candidate story ids from tool_result events. Server receipts,
// not agent prose: only top-level numeric ids in the tool's own JSON
// response count. Extra ids (from reads, not just creates) are safe —
// downstream name-matching filters non-target stories out.
export function harvestStoryIds(events: TranscriptEvent[]): Set<number> {
	const ids = new Set<number>();
	for (const ev of events) {
		if (ev.type !== "tool_result") continue;
		if ((ev as { is_error?: boolean }).is_error === true) continue;
		const output = (ev as { output?: unknown }).output;
		if (
			typeof output !== "object" ||
			output === null ||
			!("content" in output) ||
			!Array.isArray((output as { content: unknown }).content)
		)
			continue;
		const parts = (
			output as { content: Array<{ type?: string; text?: string }> }
		).content;
		for (const p of parts) {
			if (p.type !== "text" || typeof p.text !== "string") continue;
			const stripped = p.text.replace(/^API Response \(Status: \d+\):\s*/, "");
			let parsed: unknown;
			try {
				parsed = JSON.parse(stripped);
			} catch {
				continue;
			}
			if (
				typeof parsed === "object" &&
				parsed !== null &&
				"id" in parsed &&
				typeof (parsed as { id: unknown }).id === "number"
			) {
				ids.add((parsed as { id: number }).id);
			}
		}
	}
	return ids;
}

type ResolveOutcome =
	| { kind: "hit"; story: LiveStoryFull }
	| { kind: "ambiguous"; ids: number[] }
	| { kind: "miss" };

async function defaultSleep(ms: number): Promise<void> {
	await new Promise((r) => setTimeout(r, ms));
}

// Retry policy: 4 total attempts spaced by 0s / 2s / 4s / 8s, per the
// 1.8 diagnosis. Shortcut's search index is eventually consistent;
// short reads immediately after a create sometimes miss. Every attempt
// is logged as a receipt so a disputed grade can be re-litigated.
const RETRY_DELAYS_MS = [0, 2000, 4000, 8000] as const;

export async function resolveByNameWithRetry(
	workspace: Workspace,
	title: string,
	casing: "insensitive" | "exact",
	receipts: Receipt[],
	sleep: (ms: number) => Promise<void> = defaultSleep,
): Promise<ResolveOutcome> {
	for (let attempt = 0; attempt < RETRY_DELAYS_MS.length; attempt++) {
		const delay = RETRY_DELAYS_MS[attempt] ?? 0;
		if (delay > 0) await sleep(delay);
		const results = await workspace.searchByName(title);
		receipts.push({
			endpoint: `GET /search/stories?query=name:"${title}" (attempt ${attempt + 1}, delay ${delay}ms)`,
			at: new Date().toISOString(),
		});
		const matches = results.filter((s) => casingEqual(s.name, title, casing));
		if (matches.length === 1) {
			const first = matches[0];
			if (!first) continue;
			const full = await workspace.fetchStory(first.id);
			receipts.push({
				endpoint: `GET /stories/${first.id}`,
				at: new Date().toISOString(),
			});
			if (full) return { kind: "hit", story: full };
		} else if (matches.length > 1) {
			return { kind: "ambiguous", ids: matches.map((m) => m.id) };
		}
	}
	return { kind: "miss" };
}

// Id-first resolution: verify each harvested id against the workspace,
// keep the ones whose name matches the target title with tolerance.
async function resolveByHarvestedIds(
	workspace: Workspace,
	ids: Iterable<number>,
	title: string,
	casing: "insensitive" | "exact",
	receipts: Receipt[],
): Promise<ResolveOutcome> {
	const hits: LiveStoryFull[] = [];
	for (const id of ids) {
		const full = await workspace.fetchStory(id);
		receipts.push({
			endpoint: `GET /stories/${id} (id-first)`,
			at: new Date().toISOString(),
		});
		if (full && casingEqual(full.name, title, casing)) hits.push(full);
	}
	if (hits.length === 1) {
		const first = hits[0];
		if (first) return { kind: "hit", story: first };
	}
	if (hits.length > 1) return { kind: "ambiguous", ids: hits.map((s) => s.id) };
	return { kind: "miss" };
}

export async function checkStoryExists(
	inner: {
		title: string;
		state_name?: string;
		story_type?: string;
		owner_is_self?: boolean;
		team?: string;
		deadline_within?: { date: string; timezone: string };
		tasks?: string[];
		description_contains?: string;
	},
	inputs: GradeInputs,
	vocab: Vocabulary,
	workspace: Workspace,
	sleep: (ms: number) => Promise<void> = defaultSleep,
): Promise<CheckResult> {
	const receipts: Receipt[] = [];
	const casing = taskCasing(inputs.task);
	const title = substituteRun(inner.title, inputs.runStamp);

	// Story resolution: id-first from server receipts in the transcript,
	// name-search fallback with bounded logged retries.
	const harvested = harvestStoryIds(inputs.events);
	let outcome: ResolveOutcome = await resolveByHarvestedIds(
		workspace,
		harvested,
		title,
		casing,
		receipts,
	);
	if (outcome.kind === "miss") {
		outcome = await resolveByNameWithRetry(
			workspace,
			title,
			casing,
			receipts,
			sleep,
		);
	}

	if (outcome.kind === "miss") {
		return {
			kind: "story_exists",
			ok: false,
			details: {
				title,
				match_count: 0,
				reason:
					"no story with matching title (id-first + name-retry both missed)",
				harvested_ids: [...harvested],
			},
			receipts,
		};
	}
	if (outcome.kind === "ambiguous") {
		return {
			kind: "story_exists",
			ok: false,
			details: {
				title,
				match_count: outcome.ids.length,
				match_ids: outcome.ids,
				reason: "ambiguous: multiple matches",
			},
			receipts,
		};
	}
	const story = outcome.story;

	const failures: string[] = [];
	if (inner.state_name !== undefined) {
		const actualStateName =
			vocab.stateNameById.get(story.workflow_state_id) ?? "?";
		if (!casingEqual(actualStateName, inner.state_name, casing)) {
			failures.push(
				`state_name: expected "${inner.state_name}", got "${actualStateName}"`,
			);
		}
	}
	if (inner.story_type !== undefined && story.story_type !== inner.story_type) {
		failures.push(
			`story_type: expected "${inner.story_type}", got "${story.story_type}"`,
		);
	}
	if (inner.owner_is_self === true) {
		if (!story.owner_ids.includes(vocab.self.id)) {
			failures.push(
				`owner_is_self: self (${vocab.self.id}) not in owner_ids [${story.owner_ids.join(",")}]`,
			);
		}
	}
	if (inner.team !== undefined) {
		const wantedTeamName = inner.team;
		const wantedTeam = vocab.groups.find(
			(g) =>
				casingEqual(g.name, wantedTeamName, casing) ||
				casingEqual(g.mention_name, wantedTeamName, casing),
		);
		if (!wantedTeam) {
			failures.push(`team: unknown team "${inner.team}"`);
		} else if (story.group_id === null) {
			failures.push(`team: expected "${inner.team}", story has none`);
		} else if (story.group_id !== wantedTeam.id) {
			const actualName =
				vocab.groups.find((g) => g.id === story.group_id)?.name ??
				story.group_id;
			failures.push(`team: expected "${inner.team}", got "${actualName}"`);
		}
	}
	if (inner.deadline_within !== undefined) {
		if (!story.deadline) {
			failures.push(`deadline_within: story has no deadline`);
		} else {
			const gotDate = calendarDateInTimezone(
				story.deadline,
				inner.deadline_within.timezone,
			);
			if (gotDate !== inner.deadline_within.date) {
				failures.push(
					`deadline_within: expected ${inner.deadline_within.date} in ${inner.deadline_within.timezone}, got ${gotDate} (from ${story.deadline})`,
				);
			}
		}
	}
	if (inner.tasks !== undefined) {
		const gotDescs = story.tasks.map((t) => t.description);
		const gotLower = new Set(
			gotDescs.map((d) => (casing === "exact" ? d : d.toLowerCase())),
		);
		const wantLower = new Set(
			inner.tasks.map((d) => (casing === "exact" ? d : d.toLowerCase())),
		);
		if (!eqSet(gotLower, wantLower)) {
			failures.push(
				`tasks set differs: expected ${JSON.stringify(inner.tasks)}, got ${JSON.stringify(gotDescs)}`,
			);
		}
	}
	if (inner.description_contains !== undefined) {
		if (
			!casingContains(story.description, inner.description_contains, casing)
		) {
			failures.push(`description_contains: not found`);
		}
	}
	return {
		kind: "story_exists",
		ok: failures.length === 0,
		details: {
			title,
			story_id: story.id,
			failures,
		},
		receipts,
	};
}

async function checkStoryAbsent(
	inner: { title: string },
	inputs: GradeInputs,
	workspace: Workspace,
	sleep: (ms: number) => Promise<void> = defaultSleep,
): Promise<CheckResult> {
	const receipts: Receipt[] = [];
	const casing = taskCasing(inputs.task);
	const title = substituteRun(inner.title, inputs.runStamp);

	// Id-first short-circuit: if any harvested id from the transcript
	// resolves to a live story with this title, absence is refuted
	// without needing the search index to be caught up.
	const harvested = harvestStoryIds(inputs.events);
	const idHit = await resolveByHarvestedIds(
		workspace,
		harvested,
		title,
		casing,
		receipts,
	);
	if (idHit.kind === "hit" || idHit.kind === "ambiguous") {
		const ids = idHit.kind === "hit" ? [idHit.story.id] : idHit.ids;
		return {
			kind: "story_absent",
			ok: false,
			details: {
				title,
				match_count: ids.length,
				match_ids: ids,
				reason: "story created during attempt (id-first)",
			},
			receipts,
		};
	}

	// No id hit — fall back to name search with the same bounded retry
	// as story_exists, but here a MISS means the check passes.
	const outcome = await resolveByNameWithRetry(
		workspace,
		title,
		casing,
		receipts,
		sleep,
	);
	const ok = outcome.kind === "miss";
	const matchIds =
		outcome.kind === "hit"
			? [outcome.story.id]
			: outcome.kind === "ambiguous"
				? outcome.ids
				: [];
	return {
		kind: "story_absent",
		ok,
		details: {
			title,
			match_count: matchIds.length,
			match_ids: matchIds,
		},
		receipts,
	};
}

async function checkCommentOn(
	inner: { story: string | number; text_contains: string },
	inputs: GradeInputs,
): Promise<CheckResult> {
	const receipts: Receipt[] = [];
	const casing = taskCasing(inputs.task);
	let storyId: number | undefined;
	if (typeof inner.story === "number") {
		storyId = inner.story;
	} else {
		const fx = inputs.fixtures.find((f) => f.ref === inner.story);
		if (fx) storyId = fx.live_id;
	}
	if (!storyId) {
		return {
			kind: "comment_on",
			ok: false,
			details: { reason: `unresolved story ref "${inner.story}"` },
			receipts,
		};
	}
	const story = await fetchStoryFull(inputs.token, storyId);
	receipts.push({
		endpoint: `GET /stories/${storyId}`,
		at: new Date().toISOString(),
	});
	if (!story) {
		return {
			kind: "comment_on",
			ok: false,
			details: { story_id: storyId, reason: "story not found" },
			receipts,
		};
	}
	const live = story.comments.filter((c) => c.deleted !== true);
	const hit = live.find(
		(c) => c.text && casingContains(c.text, inner.text_contains, casing),
	);
	return {
		kind: "comment_on",
		ok: hit !== undefined,
		details: {
			story_id: storyId,
			live_comment_count: live.length,
			text_contains: inner.text_contains,
		},
		receipts,
	};
}

async function checkAnswerIds(
	inner: { equals_state?: string; equals_fixture?: string },
	inputs: GradeInputs,
): Promise<CheckResult> {
	const receipts: Receipt[] = [];
	const answer = finalAnswer(inputs.events);
	const got = extractIds(answer);
	let expected: Set<number>;
	let source: string;
	if (inner.equals_state !== undefined) {
		const wanted = inner.equals_state;
		const stories = await fetchTeamStories(inputs.token, TEAM_MENTION_NAME);
		receipts.push({
			endpoint: `GET /search/stories?query=team:${TEAM_MENTION_NAME}`,
			at: new Date().toISOString(),
		});
		const vocab = await loadVocabulary(inputs.token);
		const targetId = vocab.stateIdByName.get(wanted.toLowerCase());
		if (targetId === undefined) {
			return {
				kind: "answer_ids",
				ok: false,
				details: { reason: `unknown state "${wanted}"` },
				receipts,
			};
		}
		expected = new Set(
			stories.filter((s) => s.workflow_state_id === targetId).map((s) => s.id),
		);
		source = `equals_state:${wanted}`;
	} else if (inner.equals_fixture !== undefined) {
		const fx = inputs.fixtures.find((f) => f.ref === inner.equals_fixture);
		if (!fx) {
			return {
				kind: "answer_ids",
				ok: false,
				details: { reason: `unresolved fixture ref "${inner.equals_fixture}"` },
				receipts,
			};
		}
		expected = new Set([fx.live_id]);
		source = `equals_fixture:${inner.equals_fixture}`;
	} else {
		return {
			kind: "answer_ids",
			ok: false,
			details: { reason: "no equals_state or equals_fixture" },
			receipts,
		};
	}
	return {
		kind: "answer_ids",
		ok: eqSet(got, expected),
		details: {
			answer,
			got: [...got].sort((a, b) => a - b),
			expected: [...expected].sort((a, b) => a - b),
			source,
		},
		receipts,
	};
}

function checkWorkspaceUnchanged(inputs: GradeInputs): CheckResult {
	const fixtureIds = new Set(inputs.fixtures.map((f) => f.live_id));
	const created: number[] = [];
	for (const id of inputs.postIds) {
		if (!inputs.preIds.has(id) && !fixtureIds.has(id)) created.push(id);
	}
	const missing: number[] = [];
	for (const id of inputs.preIds) {
		if (!inputs.postIds.has(id)) missing.push(id);
	}
	return {
		kind: "workspace_unchanged",
		ok: created.length === 0 && missing.length === 0,
		details: { created, missing, fixture_ids: [...fixtureIds] },
		receipts: [],
	};
}

export async function grade(inputs: GradeInputs): Promise<GradeRecord> {
	const measurements = computeMeasurements(
		inputs.events,
		inputs.task,
		inputs.laneId,
	);
	const checks: CheckResult[] = [];
	const workspace = createLiveWorkspace(inputs.token);
	try {
		const vocab = await loadVocabulary(inputs.token);
		for (const g of inputs.task.grade) {
			if (g.story_exists !== undefined) {
				checks.push(
					await checkStoryExists(g.story_exists, inputs, vocab, workspace),
				);
			} else if (g.story_absent !== undefined) {
				checks.push(await checkStoryAbsent(g.story_absent, inputs, workspace));
			} else if (g.comment_on !== undefined) {
				checks.push(await checkCommentOn(g.comment_on, inputs));
			} else if (g.answer_ids !== undefined) {
				checks.push(await checkAnswerIds(g.answer_ids, inputs));
			} else if (g.workspace_unchanged === true) {
				checks.push(checkWorkspaceUnchanged(inputs));
			}
		}
	} catch (e) {
		return {
			type: "grade",
			status: "ungraded",
			reason: `grader crashed: ${(e as Error).message}`,
			checks,
			measurements,
			at: new Date().toISOString(),
		};
	}
	const allPass = checks.length > 0 && checks.every((c) => c.ok);
	return {
		type: "grade",
		status: allPass ? "pass" : "fail",
		checks,
		measurements,
		at: new Date().toISOString(),
	};
}
