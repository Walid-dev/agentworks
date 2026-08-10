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
