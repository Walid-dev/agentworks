import { checkBaseline, snapshotIdSet } from "./baseline.js";
import type { Fixture } from "./setup.js";
import { deleteStory, fetchStory, type LiveStory } from "./shortcut.js";

// Teardown runs after an attempt. As of L7-fix (2026-08-18): teardown
// is ID-FIRST — every story id created during the attempt is
// harvested from the transcript's tool_result bodies, deleted by id,
// and verified by direct GET expecting 404. Direct id reads are not
// index-lagged (unlike /search/stories), so the verify step closes
// the L7 hole where sc-570 slipped past the search-based sweep on
// the Terra full-run.
//
// The search-based stray sweep still runs AFTER as belt-and-braces
// (with one bounded re-poll if the index looks stale). It catches
// agent-created stories that never surfaced through the transcript
// (mangled tool_result, non-JSON body, etc). baseline_reverify may
// only report ok when the id-verified deletions all confirmed AND
// the search-based baseline check passes.
//
// Bounded retry (rung-2 gate ruling, 2026-08-14): a single transient
// upstream 500 during a delete must never end a sweep. Each
// destructive call retries 3 times with 2s / 4s / 8s backoff — same
// shape as the graders' read retries. Every attempt (successful or
// not) lands in the TeardownRecord.retries array so a disputed
// teardown can be re-litigated from its own receipts.

export type TeardownRetryEvent = {
	kind: "fetch" | "delete" | "verify";
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
	verified_absent: number[];
	errors: string[];
	retries: TeardownRetryEvent[];
	baseline_reverify: { ok: boolean; issues: string[] };
};

const RETRY_DELAYS_MS = [0, 2000, 4000, 8000] as const;
const INDEX_LAG_REPOLL_MS = 2000;

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

// Verify by direct GET that a just-deleted story returns 404. Direct
// id reads are not index-lagged, unlike /search/stories, so this
// closes the L7 hole. Bounded retry on unexpected non-404 (e.g.
// eventual-consistency inside Shortcut's own read layer): 4 attempts
// with the same backoff.
async function verifyAbsentWithRetry(
	token: string,
	id: number,
	log: TeardownRetryEvent[],
	sleep: (ms: number) => Promise<void> = defaultSleep,
): Promise<boolean> {
	let lastErr: Error | undefined;
	for (let i = 0; i < RETRY_DELAYS_MS.length; i++) {
		const delay = RETRY_DELAYS_MS[i] ?? 0;
		if (delay > 0) await sleep(delay);
		try {
			const s = await fetchStory(token, id);
			// fetchStory returns null on 404 — that is the confirmation.
			if (s === null) {
				log.push({
					kind: "verify",
					story_id: id,
					attempt: i + 1,
					delay_ms_before: delay,
					ok: true,
					http_status: 404,
					at: new Date().toISOString(),
				});
				return true;
			}
			// Story still visible — retry after backoff.
			log.push({
				kind: "verify",
				story_id: id,
				attempt: i + 1,
				delay_ms_before: delay,
				ok: false,
				http_status: 200,
				error: "story still present post-delete",
				at: new Date().toISOString(),
			});
			lastErr = new Error(`verify sc-${id}: still returns 200 after delete`);
		} catch (e) {
			lastErr = e as Error;
			log.push({
				kind: "verify",
				story_id: id,
				attempt: i + 1,
				delay_ms_before: delay,
				ok: false,
				error: lastErr.message,
				at: new Date().toISOString(),
			});
		}
	}
	throw lastErr ?? new Error(`verify sc-${id} failed after retries`);
}

async function captureDeleteVerify(
	token: string,
	id: number,
	captured: LiveStory[],
	deletions: Array<{ id: number; http_status: number }>,
	verifiedAbsent: number[],
	retries: TeardownRetryEvent[],
	errors: string[],
	sleep: (ms: number) => Promise<void>,
): Promise<void> {
	try {
		const story = await fetchWithRetry(token, id, retries, sleep);
		if (story) captured.push(story);
		const status = await deleteWithRetry(token, id, retries, sleep);
		deletions.push({ id, http_status: status });
		const ok = await verifyAbsentWithRetry(token, id, retries, sleep);
		if (ok) verifiedAbsent.push(id);
	} catch (e) {
		errors.push(`teardown sc-${id}: ${(e as Error).message}`);
	}
}

export async function runTeardown(
	fixtures: Fixture[],
	preAttemptIds: Set<number>,
	harvestedIds: Set<number>,
	token: string,
	sleep: (ms: number) => Promise<void> = defaultSleep,
): Promise<TeardownRecord> {
	const captured: LiveStory[] = [];
	const deletions: Array<{ id: number; http_status: number }> = [];
	const verifiedAbsent: number[] = [];
	const errors: string[] = [];
	const retries: TeardownRetryEvent[] = [];

	// Phase 1: id-first. Fixtures we created in setup, plus every id
	// the agent's tool_result bodies surfaced that wasn't already in
	// the pre-attempt snapshot. Direct GET for verify — not index-
	// lagged.
	const idFirst = new Set<number>();
	for (const f of fixtures) idFirst.add(f.live_id);
	for (const id of harvestedIds) {
		if (!preAttemptIds.has(id)) idFirst.add(id);
	}
	for (const id of idFirst) {
		await captureDeleteVerify(
			token,
			id,
			captured,
			deletions,
			verifiedAbsent,
			retries,
			errors,
			sleep,
		);
	}

	// Phase 2: belt-and-braces search sweep. Catches agent-created
	// stories that never surfaced through the transcript (mangled
	// tool_result, non-JSON body, etc). Re-poll semantics: if the
	// snapshot still shows an id we just verified as absent via
	// direct GET, the search index is lagging — wait one bounded
	// interval and re-poll before computing extras. Extras are then
	// trusted (real strays don't disappear between polls; a
	// disappearing "extra" would only be a just-created story that
	// somehow got un-created, which cannot happen).
	const alreadyHandled = new Set<number>(idFirst);
	let snapshot = await snapshotIdSet(token);
	if (verifiedAbsent.some((id) => snapshot.has(id))) {
		await sleep(INDEX_LAG_REPOLL_MS);
		snapshot = await snapshotIdSet(token);
	}
	const extras = new Set<number>();
	for (const id of snapshot) {
		if (preAttemptIds.has(id)) continue;
		if (alreadyHandled.has(id)) continue;
		extras.add(id);
	}
	for (const id of extras) {
		await captureDeleteVerify(
			token,
			id,
			captured,
			deletions,
			verifiedAbsent,
			retries,
			errors,
			sleep,
		);
	}

	// baseline_reverify.ok requires BOTH (a) every deletion verified
	// absent by direct GET, and (b) the search-based baseline check
	// passes. Either failing carries an issues list.
	const reverify = await checkBaseline(token);
	const idIssues: string[] = [];
	for (const { id } of deletions) {
		if (!verifiedAbsent.includes(id)) {
			idIssues.push(`sc-${id} deleted but not verified absent`);
		}
	}
	const combinedIssues = [...idIssues, ...reverify.issues];
	return {
		captured,
		deletions,
		verified_absent: verifiedAbsent,
		errors,
		retries,
		baseline_reverify: {
			ok: reverify.ok && idIssues.length === 0,
			issues: combinedIssues,
		},
	};
}
