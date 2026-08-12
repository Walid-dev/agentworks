import { createStory } from "./shortcut.js";
import type { GoldenTask } from "./tasks.js";
import {
	loadVocabulary,
	resolvePriorityValueId,
	resolveStateId,
} from "./vocabulary.js";

// Setup runs before an attempt. It creates the task's fixture stories,
// substituting {{run}} with the attempt's unique stamp so repetitions
// never collide. The returned fixtures map is used by graders
// (equals_fixture, comment_on) and by teardown.

export type Fixture = {
	ref?: string;
	title: string;
	live_id: number;
};

export function substituteRun(str: string, runStamp: string): string {
	return str.replace(/\{\{run\}\}/g, runStamp);
}

// Seam invariant: nothing that has been through substitution should still
// carry a `{{name}}` placeholder. Called on every outbound API payload and
// workspace write; also called in dry-run. Same pattern as the logger's
// token-leak refusal — loud is safer than silent.
const PLACEHOLDER_RE = /\{\{[^}]*\}\}/;
export function assertNoPlaceholder(s: string, context: string): void {
	const m = s.match(PLACEHOLDER_RE);
	if (m) {
		throw new Error(
			`unsubstituted placeholder "${m[0]}" in ${context}; refusing to proceed`,
		);
	}
}

// Resolve a team name/mention_name to the workspace group id, or fall
// back to the workspace's single team when the fixture doesn't declare
// one. Throws if the workspace has zero or many teams and no explicit
// pick — that's the point at which the "workspace default" concept
// breaks and the operator must be told, not defaulted.
export function resolveTeamId(
	vocab: { groups: Array<{ id: string; name: string; mention_name: string }> },
	explicit: string | undefined,
	casing: "insensitive" | "exact" = "insensitive",
): string {
	if (explicit !== undefined) {
		const norm = casing === "exact" ? explicit : explicit.toLowerCase();
		const eq = (s: string) =>
			(casing === "exact" ? s : s.toLowerCase()) === norm;
		const match = vocab.groups.find((g) => eq(g.name) || eq(g.mention_name));
		if (!match) {
			const valid = vocab.groups.map((g) => g.mention_name).join(", ");
			throw new Error(`unknown team "${explicit}"; valid: ${valid}`);
		}
		return match.id;
	}
	if (vocab.groups.length === 1) {
		const only = vocab.groups[0];
		if (!only)
			throw new Error("vocab.groups[0] undefined despite length === 1");
		return only.id;
	}
	throw new Error(
		`fixture has no team and workspace has ${vocab.groups.length} teams; declare team explicitly`,
	);
}

export async function runSetup(
	task: GoldenTask,
	runStamp: string,
	token: string,
): Promise<Fixture[]> {
	if (!task.setup || task.setup.length === 0) return [];
	const vocab = await loadVocabulary(token);
	const fixtures: Fixture[] = [];
	for (const spec of task.setup) {
		const title = substituteRun(spec.title, runStamp);
		assertNoPlaceholder(title, `fixture title for task ${task.id}`);
		const workflow_state_id = resolveStateId(vocab, spec.state);
		const group_id = resolveTeamId(vocab, spec.team);
		const body: Parameters<typeof createStory>[1] = {
			name: title,
			story_type: spec.story_type,
			workflow_state_id,
			group_id,
		};
		if (spec.priority) {
			const cf = resolvePriorityValueId(vocab, spec.priority);
			body.custom_fields = [cf];
		}
		const story = await createStory(token, body);
		fixtures.push({ ref: spec.ref, title, live_id: story.id });
	}
	return fixtures;
}
