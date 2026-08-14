import { checkBaseline, snapshotIdSet } from "./baseline.js";
import type { Fixture } from "./setup.js";
import { deleteStory, fetchStory, type LiveStory } from "./shortcut.js";

// Teardown runs after an attempt. Capture-before-destroy: fetch each
// story we are about to delete and log its final state before deleting.
// Then re-verify the workspace matches the documented baseline; any
// mismatch is a teardown failure.
//
// Bounded retry (rung-2 gate ruling, 2026-08-14): a single transient
// upstream 500 during a delete must never end a sweep. Each destructive
// call retries 3 times with 2s / 4s / 8s backoff — same shape as the
// graders' read retries. Every attempt (successful or not) lands in the
// TeardownRecord.retries array so a disputed teardown can be
// re-litigated from its own receipts.

export type TeardownRetryEvent = {
	kind: "fetch" | "delete";
	story_id: number;
	attempt: number;
	delay_ms_before: number;
	ok: boolean;
	http_status?: number;
	error?: string;
	at: string;
};

export type TeardownRecord = {
	captured: LiveStory[];
	deletions: Array<{ id: number; http_status: number }>;
	errors: string[];
	retries: TeardownRetryEvent[];
	baseline_reverify: { ok: boolean; issues: string[] };
};

const RETRY_DELAYS_MS = [0, 2000, 4000, 8000] as const;

async function defaultSleep(ms: number): Promise<void> {
	await new Promise((r) => setTimeout(r, ms));
}

async function fetchWithRetry(
	token: string,
	id: number,
	log: TeardownRetryEvent[],
	sleep: (ms: number) => Promise<void> = defaultSleep,
): Promise<LiveStory | null> {
	let lastErr: Error | undefined;
	for (let i = 0; i < RETRY_DELAYS_MS.length; i++) {
		const delay = RETRY_DELAYS_MS[i] ?? 0;
		if (delay > 0) await sleep(delay);
		try {
			const s = await fetchStory(token, id);
			log.push({
				kind: "fetch",
				story_id: id,
				attempt: i + 1,
				delay_ms_before: delay,
				ok: true,
				at: new Date().toISOString(),
			});
			return s;
		} catch (e) {
			lastErr = e as Error;
			log.push({
				kind: "fetch",
				story_id: id,
				attempt: i + 1,
				delay_ms_before: delay,
				ok: false,
				error: lastErr.message,
				at: new Date().toISOString(),
			});
		}
	}
	throw lastErr ?? new Error(`fetchStory sc-${id} failed after retries`);
}

async function deleteWithRetry(
	token: string,
	id: number,
	log: TeardownRetryEvent[],
	sleep: (ms: number) => Promise<void> = defaultSleep,
): Promise<number> {
	let lastErr: Error | undefined;
	for (let i = 0; i < RETRY_DELAYS_MS.length; i++) {
		const delay = RETRY_DELAYS_MS[i] ?? 0;
		if (delay > 0) await sleep(delay);
		try {
			const status = await deleteStory(token, id);
			log.push({
				kind: "delete",
				story_id: id,
				attempt: i + 1,
				delay_ms_before: delay,
				ok: true,
				http_status: status,
				at: new Date().toISOString(),
			});
			return status;
		} catch (e) {
			lastErr = e as Error;
			log.push({
				kind: "delete",
				story_id: id,
				attempt: i + 1,
				delay_ms_before: delay,
				ok: false,
				error: lastErr.message,
				at: new Date().toISOString(),
			});
		}
	}
	throw lastErr ?? new Error(`deleteStory sc-${id} failed after retries`);
}

export async function runTeardown(
	fixtures: Fixture[],
	preAttemptIds: Set<number>,
	token: string,
	sleep: (ms: number) => Promise<void> = defaultSleep,
): Promise<TeardownRecord> {
	const captured: LiveStory[] = [];
	const deletions: Array<{ id: number; http_status: number }> = [];
	const errors: string[] = [];
	const retries: TeardownRetryEvent[] = [];

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
			const story = await fetchWithRetry(token, id, retries, sleep);
			if (story) captured.push(story);
			const status = await deleteWithRetry(token, id, retries, sleep);
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
		retries,
		baseline_reverify: { ok: reverify.ok, issues: reverify.issues },
	};
}
