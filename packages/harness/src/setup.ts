import type { GoldenTask } from "./tasks.js";

// Setup runs before an attempt. It creates the task's fixture stories,
// substituting {{run}} with the attempt's unique stamp so repetitions
// never collide. The fixture map returned is used by graders
// (equals_fixture) and by teardown.
//
// For the 1.6 scope, setup is stubbed — the pilot task used to verify
// (state-name-vs-type) has no setup. Full setup support (state-name-
// to-id lookup, story_type mapping, priority custom-field wiring)
// lands with the grader work in 1.7 once tasks with setup fixtures
// are exercised end to end.

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
	_runStamp: string,
	_token: string,
): Promise<Fixture[]> {
	if (!task.setup || task.setup.length === 0) return [];
	// Deliberate: any task with fixtures fails until 1.7 wires the
	// state-name / story-type / priority mappings and the create call.
	throw new Error(
		`setup not yet implemented (task ${task.id} has ${task.setup.length} fixture(s)); wire in step 1.7 before running`,
	);
}
