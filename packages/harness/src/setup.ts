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
		const body: Parameters<typeof createStory>[1] = {
			name: title,
			story_type: spec.story_type,
			workflow_state_id,
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
