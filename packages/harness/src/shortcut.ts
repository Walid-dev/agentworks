// Thin Shortcut REST client for baseline / setup / teardown / graders.
// Distinct from the MCP server in servers/shortcut-handbuilt/: the
// harness must verify ground truth against Shortcut directly, not
// through any lane.

const API = "https://api.app.shortcut.com/api/v3";

function authHeaders(token: string): Record<string, string> {
	return { "Shortcut-Token": token };
}

// One receipt per HTTP attempt. Emitted through the module-scoped
// retry logger (set for the duration of an attempt) so baseline,
// setup, teardown, and grader fetches all share one 429-aware
// retry trail.
export type ShortcutRetryEvent = {
	type: "shortcut.retry";
	method: string;
	url: string;
	attempt: number;
	delay_ms_before: number;
	ok: boolean;
	http_status?: number;
	retry_after?: string;
	error?: string;
	at: string;
};

// Retry policy: 4 total attempts. First attempt fires immediately;
// subsequent attempts wait either the server-declared Retry-After
// (429 with header set) or the fallback 2s/4s/8s backoff.
const RETRY_FALLBACK_DELAYS_MS = [0, 2000, 4000, 8000] as const;
const RETRIABLE_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

async function defaultSleep(ms: number): Promise<void> {
	await new Promise((r) => setTimeout(r, ms));
}

let attemptRetryLogger: ((event: ShortcutRetryEvent) => void) | undefined;

// runAttempt sets this at the start of each attempt so every retry
// inside baseline / setup / teardown / grader fetches lands in the
// transcript. Serially scoped — attempts don't run concurrently.
export function setShortcutRetryLogger(
	log: ((event: ShortcutRetryEvent) => void) | undefined,
): void {
	attemptRetryLogger = log;
}

// Parse Retry-After: value is either delta-seconds (RFC 7231 §7.1.3)
// or an HTTP-date. Ignore anything unparseable and fall back to the
// backoff schedule.
function parseRetryAfterMs(header: string | null): number | undefined {
	if (!header) return undefined;
	const asSeconds = Number(header);
	if (Number.isFinite(asSeconds) && asSeconds >= 0) {
		return Math.min(asSeconds * 1000, 60_000);
	}
	const asDate = Date.parse(header);
	if (!Number.isNaN(asDate)) {
		const delta = asDate - Date.now();
		return Math.max(0, Math.min(delta, 60_000));
	}
	return undefined;
}

// Shared Shortcut transport: retries on network failures, 429s (with
// Retry-After honored), and 5xx. Every attempt appends a receipt via
// the module-scoped logger when one is set (per-attempt scope, set by
// runAttempt). On final failure, throws either the transport error or
// an Error whose message reproduces the failing HTTP status + body.
export async function shortcutFetch(
	method: string,
	url: string,
	init: RequestInit,
	sleep: (ms: number) => Promise<void> = defaultSleep,
): Promise<Response> {
	let lastError: Error | undefined;
	let nextDelayMs = 0;
	for (let i = 0; i < RETRY_FALLBACK_DELAYS_MS.length; i++) {
		if (nextDelayMs > 0) await sleep(nextDelayMs);
		const delayThisAttempt = nextDelayMs;
		// Prepare the fallback delay for the NEXT attempt in case this
		// one fails without a Retry-After. i+1 into the schedule.
		nextDelayMs = RETRY_FALLBACK_DELAYS_MS[i + 1] ?? 0;
		try {
			const res = await fetch(url, init);
			if (res.ok) {
				attemptRetryLogger?.({
					type: "shortcut.retry",
					method,
					url,
					attempt: i + 1,
					delay_ms_before: delayThisAttempt,
					ok: true,
					http_status: res.status,
					at: new Date().toISOString(),
				});
				return res;
			}
			// Non-2xx: retry only for the retriable set; otherwise return
			// the response so the caller can throw with the status body.
			if (!RETRIABLE_STATUSES.has(res.status)) {
				attemptRetryLogger?.({
					type: "shortcut.retry",
					method,
					url,
					attempt: i + 1,
					delay_ms_before: delayThisAttempt,
					ok: false,
					http_status: res.status,
					at: new Date().toISOString(),
				});
				return res;
			}
			const retryAfterHeader = res.headers.get("Retry-After");
			const retryAfterMs = parseRetryAfterMs(retryAfterHeader);
			attemptRetryLogger?.({
				type: "shortcut.retry",
				method,
				url,
				attempt: i + 1,
				delay_ms_before: delayThisAttempt,
				ok: false,
				http_status: res.status,
				retry_after: retryAfterHeader ?? undefined,
				at: new Date().toISOString(),
			});
			if (retryAfterMs !== undefined) nextDelayMs = retryAfterMs;
			lastError = new Error(`Shortcut ${res.status}: ${await res.text()}`);
		} catch (e) {
			lastError = e as Error;
			attemptRetryLogger?.({
				type: "shortcut.retry",
				method,
				url,
				attempt: i + 1,
				delay_ms_before: delayThisAttempt,
				ok: false,
				error: lastError.message,
				at: new Date().toISOString(),
			});
		}
	}
	throw lastError ?? new Error(`${method} ${url} failed after retries`);
}

export type LiveStory = {
	id: number;
	name: string;
	workflow_state_id: number;
	epic_id: number | null;
	story_type: string;
};

export type LiveComment = {
	id: number;
	text: string | null;
	deleted?: boolean;
	author_id: string;
	created_at: string;
};

export type LiveStoryFull = LiveStory & {
	deadline: string | null;
	owner_ids: string[];
	group_id: string | null;
	description: string;
	tasks: Array<{ description: string; complete: boolean }>;
	comments: LiveComment[];
	custom_fields?: Array<{ field_id: string; value_id: string; value: string }>;
};

export type WorkflowState = {
	id: number;
	name: string;
	type: string;
};

export type Workflow = {
	id: number;
	name: string;
	default_state_id: number;
	states: WorkflowState[];
};

export type CustomFieldValue = {
	id: string;
	value: string;
	enabled: boolean;
};

export type CustomField = {
	id: string;
	name: string;
	canonical_name: string;
	field_type: string;
	values: CustomFieldValue[];
};

export type Member = {
	id: string;
	name: string;
	mention_name: string;
};

export type Group = { id: string; name: string; mention_name: string };

// Workspace-wide title search, no team filter. Team membership is a
// grader assertion, not a search scope — teamless stories must remain
// findable so the grader can name the missing team as a failure.
export async function searchByName(
	token: string,
	title: string,
): Promise<LiveStory[]> {
	const q = encodeURIComponent(`name:"${title.replace(/"/g, '\\"')}"`);
	const url = `${API}/search/stories?query=${q}&page_size=25`;
	const res = await shortcutFetch("GET", url, { headers: authHeaders(token) });
	if (!res.ok) throw new Error(`Shortcut ${res.status}: ${await res.text()}`);
	const data = (await res.json()) as { data: LiveStory[] };
	return data.data;
}

// Workspace-wide state search, no team filter — same reason as
// searchByName. equals_state's expected set must include teamless
// stories that happen to sit in the target state.
export async function searchByState(
	token: string,
	stateName: string,
): Promise<LiveStory[]> {
	const q = encodeURIComponent(`state:"${stateName.replace(/"/g, '\\"')}"`);
	const url = `${API}/search/stories?query=${q}&page_size=100`;
	const res = await shortcutFetch("GET", url, { headers: authHeaders(token) });
	if (!res.ok) throw new Error(`Shortcut ${res.status}: ${await res.text()}`);
	const data = (await res.json()) as { data: LiveStory[] };
	return data.data;
}

// Workspace-wide story list, no team filter. Used by baseline check
// and snapshotIdSet so teamless artifacts are visible to the harness
// (and can be caught, cleaned up, or refused). Baseline should be a
// property of the whole workspace, not of one team.
export async function fetchAllStories(token: string): Promise<LiveStory[]> {
	const q = encodeURIComponent("is:story");
	const url = `${API}/search/stories?query=${q}&page_size=100`;
	const res = await shortcutFetch("GET", url, { headers: authHeaders(token) });
	if (!res.ok) throw new Error(`Shortcut ${res.status}: ${await res.text()}`);
	const data = (await res.json()) as { data: LiveStory[] };
	return data.data;
}

export async function fetchStory(
	token: string,
	id: number,
): Promise<LiveStory | null> {
	const res = await shortcutFetch("GET", `${API}/stories/${id}`, {
		headers: authHeaders(token),
	});
	if (res.status === 404) return null;
	if (!res.ok) throw new Error(`Shortcut ${res.status}: ${await res.text()}`);
	return (await res.json()) as LiveStory;
}

export async function deleteStory(token: string, id: number): Promise<number> {
	const res = await shortcutFetch("DELETE", `${API}/stories/${id}`, {
		method: "DELETE",
		headers: authHeaders(token),
	});
	if (!res.ok && res.status !== 404) {
		throw new Error(`Shortcut ${res.status}: ${await res.text()}`);
	}
	return res.status;
}

export async function fetchStoryFull(
	token: string,
	id: number,
): Promise<LiveStoryFull | null> {
	const res = await shortcutFetch("GET", `${API}/stories/${id}`, {
		headers: authHeaders(token),
	});
	if (res.status === 404) return null;
	if (!res.ok) throw new Error(`Shortcut ${res.status}: ${await res.text()}`);
	return (await res.json()) as LiveStoryFull;
}

export async function fetchWorkflows(token: string): Promise<Workflow[]> {
	const res = await shortcutFetch("GET", `${API}/workflows`, {
		headers: authHeaders(token),
	});
	if (!res.ok) throw new Error(`Shortcut ${res.status}: ${await res.text()}`);
	return (await res.json()) as Workflow[];
}

export async function fetchCustomFields(token: string): Promise<CustomField[]> {
	const res = await shortcutFetch("GET", `${API}/custom-fields`, {
		headers: authHeaders(token),
	});
	if (!res.ok) throw new Error(`Shortcut ${res.status}: ${await res.text()}`);
	return (await res.json()) as CustomField[];
}

export async function fetchSelf(token: string): Promise<Member> {
	const res = await shortcutFetch("GET", `${API}/member`, {
		headers: authHeaders(token),
	});
	if (!res.ok) throw new Error(`Shortcut ${res.status}: ${await res.text()}`);
	return (await res.json()) as Member;
}

export async function fetchGroups(token: string): Promise<Group[]> {
	const res = await shortcutFetch("GET", `${API}/groups`, {
		headers: authHeaders(token),
	});
	if (!res.ok) throw new Error(`Shortcut ${res.status}: ${await res.text()}`);
	return (await res.json()) as Group[];
}

export type CreateStoryBody = {
	name: string;
	story_type: string;
	workflow_state_id: number;
	group_id?: string;
	owner_ids?: string[];
	requested_by_id?: string;
	custom_fields?: Array<{ field_id: string; value_id: string }>;
};

export async function createStory(
	token: string,
	body: CreateStoryBody,
): Promise<LiveStoryFull> {
	const res = await shortcutFetch("POST", `${API}/stories`, {
		method: "POST",
		headers: { ...authHeaders(token), "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
	if (!res.ok) throw new Error(`Shortcut ${res.status}: ${await res.text()}`);
	return (await res.json()) as LiveStoryFull;
}
