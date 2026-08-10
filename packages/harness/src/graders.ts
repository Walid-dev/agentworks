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
	type LiveStory,
} from "./shortcut.js";
import type { GoldenTask } from "./tasks.js";
import { loadVocabulary, type Vocabulary } from "./vocabulary.js";

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

async function findByTitle(
	token: string,
	title: string,
	casing: "insensitive" | "exact",
	receipts: Receipt[],
): Promise<LiveStory[]> {
	const stories = await fetchTeamStories(token, TEAM_MENTION_NAME);
	receipts.push({
		endpoint: `GET /search/stories?query=team:${TEAM_MENTION_NAME}`,
		at: new Date().toISOString(),
	});
	return stories.filter((s) => casingEqual(s.name, title, casing));
}

async function checkStoryExists(
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
): Promise<CheckResult> {
	const receipts: Receipt[] = [];
	const casing = taskCasing(inputs.task);
	const title = substituteRun(inner.title, inputs.runStamp);
	const matches = await findByTitle(inputs.token, title, casing, receipts);
	if (matches.length !== 1) {
		return {
			kind: "story_exists",
			ok: false,
			details: {
				title,
				match_count: matches.length,
				match_ids: matches.map((m) => m.id),
				reason:
					matches.length === 0
						? "no story with matching title"
						: "ambiguous: multiple matches",
			},
			receipts,
		};
	}
	const matched = matches[0];
	if (!matched) {
		return {
			kind: "story_exists",
			ok: false,
			details: {
				title,
				reason: "index 0 missing despite length 1 (impossible)",
			},
			receipts,
		};
	}
	const story = await fetchStoryFull(inputs.token, matched.id);
	receipts.push({
		endpoint: `GET /stories/${matched.id}`,
		at: new Date().toISOString(),
	});
	if (!story) {
		return {
			kind: "story_exists",
			ok: false,
			details: { title, reason: "matched story disappeared before fetch" },
			receipts,
		};
	}
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
		} else if (story.group_id !== wantedTeam.id) {
			failures.push(
				`team: expected group_id ${wantedTeam.id} (${inner.team}), got ${story.group_id}`,
			);
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
			story_id: matched.id,
			failures,
		},
		receipts,
	};
}

async function checkStoryAbsent(
	inner: { title: string },
	inputs: GradeInputs,
): Promise<CheckResult> {
	const receipts: Receipt[] = [];
	const casing = taskCasing(inputs.task);
	const title = substituteRun(inner.title, inputs.runStamp);
	const matches = await findByTitle(inputs.token, title, casing, receipts);
	return {
		kind: "story_absent",
		ok: matches.length === 0,
		details: {
			title,
			match_count: matches.length,
			match_ids: matches.map((m) => m.id),
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
	try {
		const vocab = await loadVocabulary(inputs.token);
		for (const g of inputs.task.grade) {
			if (g.story_exists !== undefined) {
				checks.push(await checkStoryExists(g.story_exists, inputs, vocab));
			} else if (g.story_absent !== undefined) {
				checks.push(await checkStoryAbsent(g.story_absent, inputs));
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
