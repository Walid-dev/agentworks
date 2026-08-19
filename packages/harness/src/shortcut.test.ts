import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	type ShortcutRetryEvent,
	setShortcutRetryLogger,
	shortcutFetch,
} from "./shortcut.js";

// shortcutFetch is the shared retrying transport for baseline / setup
// / teardown / grader fetches. Its contract: retries on network
// failures, 429s (honoring Retry-After), and 5xx; emits one receipt
// per attempt through the module-scoped retry logger; final failure
// re-throws.

function makeResponse(
	status: number,
	body: string,
	headers?: Record<string, string>,
): Response {
	return new Response(body, { status, headers });
}

describe("shortcutFetch (shared retry transport)", () => {
	const events: ShortcutRetryEvent[] = [];
	let fetchMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		events.length = 0;
		setShortcutRetryLogger((e) => events.push(e));
		fetchMock = vi.fn();
		vi.stubGlobal("fetch", fetchMock);
	});

	afterEach(() => {
		setShortcutRetryLogger(undefined);
		vi.unstubAllGlobals();
	});

	it("returns 2xx on first success without sleeping and emits one ok receipt", async () => {
		fetchMock.mockResolvedValueOnce(makeResponse(200, "{}"));
		const sleeps: number[] = [];
		const res = await shortcutFetch("GET", "http://x/y", {}, async (ms) => {
			sleeps.push(ms);
		});
		expect(res.status).toBe(200);
		expect(sleeps).toEqual([]);
		expect(events).toHaveLength(1);
		expect(events[0]).toMatchObject({
			method: "GET",
			url: "http://x/y",
			attempt: 1,
			delay_ms_before: 0,
			ok: true,
			http_status: 200,
		});
	});

	it("retries on 429 with the 2s/4s/8s fallback backoff when no Retry-After is set", async () => {
		fetchMock
			.mockResolvedValueOnce(makeResponse(429, "throttled"))
			.mockResolvedValueOnce(makeResponse(429, "throttled"))
			.mockResolvedValueOnce(makeResponse(200, "{}"));
		const sleeps: number[] = [];
		const res = await shortcutFetch("GET", "http://x/y", {}, async (ms) => {
			sleeps.push(ms);
		});
		expect(res.status).toBe(200);
		// Fallback schedule kicks in when Retry-After is absent: attempt 2
		// waits 2000, attempt 3 waits 4000. Only two sleeps because
		// attempt 1 is immediate.
		expect(sleeps).toEqual([2000, 4000]);
		expect(events).toHaveLength(3);
		expect(events[0]?.ok).toBe(false);
		expect(events[0]?.http_status).toBe(429);
		expect(events[2]?.ok).toBe(true);
	});

	it("honors Retry-After (seconds) in preference to the backoff schedule", async () => {
		fetchMock
			.mockResolvedValueOnce(
				makeResponse(429, "throttled", { "Retry-After": "5" }),
			)
			.mockResolvedValueOnce(makeResponse(200, "{}"));
		const sleeps: number[] = [];
		const res = await shortcutFetch("GET", "http://x/y", {}, async (ms) => {
			sleeps.push(ms);
		});
		expect(res.status).toBe(200);
		// Second attempt sleeps 5000ms per Retry-After, not the fallback 2000ms.
		expect(sleeps).toEqual([5000]);
		expect(events[0]?.retry_after).toBe("5");
	});

	it("retries on 5xx too (503 is transient by contract)", async () => {
		fetchMock
			.mockResolvedValueOnce(makeResponse(503, "down"))
			.mockResolvedValueOnce(makeResponse(200, "{}"));
		const res = await shortcutFetch("GET", "http://x/y", {}, async () => {});
		expect(res.status).toBe(200);
		expect(events[0]?.http_status).toBe(503);
	});

	it("returns non-retriable 4xx immediately (404 is legit, not transient)", async () => {
		fetchMock.mockResolvedValueOnce(makeResponse(404, "not found"));
		const res = await shortcutFetch("GET", "http://x/y", {}, async () => {});
		expect(res.status).toBe(404);
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(events).toHaveLength(1);
		expect(events[0]?.http_status).toBe(404);
		expect(events[0]?.ok).toBe(false);
	});

	it("retries on network errors (TypeError 'fetch failed') and returns eventual success", async () => {
		fetchMock
			.mockRejectedValueOnce(new TypeError("fetch failed"))
			.mockRejectedValueOnce(new TypeError("fetch failed"))
			.mockResolvedValueOnce(makeResponse(200, "{}"));
		const sleeps: number[] = [];
		const res = await shortcutFetch("GET", "http://x/y", {}, async (ms) => {
			sleeps.push(ms);
		});
		expect(res.status).toBe(200);
		expect(sleeps).toEqual([2000, 4000]);
		expect(events[0]?.error).toBe("fetch failed");
		expect(events[1]?.error).toBe("fetch failed");
		expect(events[2]?.ok).toBe(true);
	});

	it("re-throws the last error after 4 total attempts of 429s", async () => {
		// mockImplementation returns a fresh Response each call — real fetch
		// does the same, and .text() can only be read once per Response.
		fetchMock.mockImplementation(() =>
			Promise.resolve(makeResponse(429, "still throttled")),
		);
		const sleeps: number[] = [];
		await expect(
			shortcutFetch("GET", "http://x/y", {}, async (ms) => {
				sleeps.push(ms);
			}),
		).rejects.toThrow(/Shortcut 429/);
		expect(fetchMock).toHaveBeenCalledTimes(4);
		expect(events).toHaveLength(4);
		expect(sleeps).toEqual([2000, 4000, 8000]);
	});

	it("logger scope: after setShortcutRetryLogger(undefined), no more events land", async () => {
		fetchMock.mockResolvedValueOnce(makeResponse(200, "{}"));
		setShortcutRetryLogger(undefined);
		await shortcutFetch("GET", "http://x/y", {}, async () => {});
		expect(events).toHaveLength(0);
	});
});
