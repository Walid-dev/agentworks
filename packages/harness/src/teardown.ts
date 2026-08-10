import { checkBaseline, snapshotIdSet } from "./baseline.js";
import type { Fixture } from "./setup.js";
import { deleteStory, fetchStory, type LiveStory } from "./shortcut.js";

// Teardown runs after an attempt. Capture-before-destroy: fetch each
// story we are about to delete and log its final state before deleting.
// Then re-verify the workspace matches the documented baseline; any
// mismatch is a teardown failure.

export type TeardownRecord = {
	captured: LiveStory[];
	deletions: Array<{ id: number; http_status: number }>;
	errors: string[];
	baseline_reverify: { ok: boolean; issues: string[] };
};

export async function runTeardown(
	fixtures: Fixture[],
	preAttemptIds: Set<number>,
	token: string,
): Promise<TeardownRecord> {
	const captured: LiveStory[] = [];
	const deletions: Array<{ id: number; http_status: number }> = [];
	const errors: string[] = [];

	// Fixtures created in setup.
	const toDelete = new Set<number>(fixtures.map((f) => f.live_id));

	// Any story present now but not in the pre-attempt snapshot: an
	// artifact the agent created that setup did not.
	const postSnapshot = await snapshotIdSet(token);
	for (const id of postSnapshot) {
		if (!preAttemptIds.has(id)) toDelete.add(id);
	}

	for (const id of toDelete) {
		try {
			const story = await fetchStory(token, id);
			if (story) captured.push(story);
			const status = await deleteStory(token, id);
			deletions.push({ id, http_status: status });
		} catch (e) {
			errors.push(`teardown sc-${id}: ${(e as Error).message}`);
		}
	}

	const reverify = await checkBaseline(token);
	return {
		captured,
		deletions,
		errors,
		baseline_reverify: { ok: reverify.ok, issues: reverify.issues },
	};
}
