import { describe, expect, it } from "vitest";
import {
	calendarDateInTimezone,
	casingEqual,
	extractIds,
	type Receipt,
	withFetchRetry,
} from "./graders.js";

// Pure-logic tests for the grader's helpers. The full grader hits the
// live Shortcut workspace and is exercised by the pilot sweep in
// runs/. These cover the tolerance edges the graders spec names:
// extraction ambiguity, casing, and date-window boundaries.

describe("extractIds", () => {
	it("extracts a standalone integer", () => {
		expect([...extractIds("17")]).toEqual([17]);
	});

	it("extracts sc-prefixed ids", () => {
		expect([...extractIds("sc-42")]).toEqual([42]);
	});

	it("extracts multiple ids from a comma-separated list", () => {
		const got = extractIds("17, 23, 42");
		expect([...got].sort((a, b) => a - b)).toEqual([17, 23, 42]);
	});

	it("deduplicates repeated ids", () => {
		expect([...extractIds("17, 17, 17")]).toEqual([17]);
	});

	it("returns empty set on prose with no numbers", () => {
		expect([...extractIds("I need more information to answer.")]).toEqual([]);
	});

	it("catches embedded numbers as ambiguity (set mismatch downstream)", () => {
		// "story 17 due 2026-08-21" should extract 17, 2026, 8, 21 — an
		// ambiguity the answer_ids set comparison will surface as a fail.
		const got = extractIds("story 17 due 2026-08-21");
		expect([...got].sort((a, b) => a - b)).toEqual([8, 17, 21, 2026]);
	});
});

describe("casingEqual", () => {
	it("insensitive matches across cases", () => {
		expect(casingEqual("In Progress", "in progress", "insensitive")).toBe(true);
	});

	it("insensitive rejects unrelated strings", () => {
		expect(casingEqual("In Progress", "Done", "insensitive")).toBe(false);
	});

	it("exact rejects case differences", () => {
		expect(casingEqual("In Progress", "in progress", "exact")).toBe(false);
	});

	it("exact accepts identical strings", () => {
		expect(casingEqual("In Progress", "In Progress", "exact")).toBe(true);
	});
});

describe("calendarDateInTimezone (date-window boundaries)", () => {
	// The pilot-deadline task grades "2026-08-21 end of day Toronto".
	// Shortcut stores the deadline as a UTC instant; the grader must
	// agree the instant falls inside the target calendar day when read
	// in the named timezone. Toronto is UTC-4 in August (DST).

	it("2026-08-22T03:59:59Z falls inside 2026-08-21 Toronto (last minute)", () => {
		expect(
			calendarDateInTimezone("2026-08-22T03:59:59Z", "America/Toronto"),
		).toBe("2026-08-21");
	});

	it("2026-08-22T04:00:00Z falls into 2026-08-22 Toronto (rollover)", () => {
		expect(
			calendarDateInTimezone("2026-08-22T04:00:00Z", "America/Toronto"),
		).toBe("2026-08-22");
	});

	it("2026-08-21T04:00:00Z is the first minute of 2026-08-21 Toronto", () => {
		expect(
			calendarDateInTimezone("2026-08-21T04:00:00Z", "America/Toronto"),
		).toBe("2026-08-21");
	});

	it("2026-08-21T03:59:59Z is still 2026-08-20 in Toronto (pre-rollover)", () => {
		expect(
			calendarDateInTimezone("2026-08-21T03:59:59Z", "America/Toronto"),
		).toBe("2026-08-20");
	});
});

describe("withFetchRetry (bounded retry for grader live fetches)", () => {
	// Terra bridge, state-name-vs-type curated rep 1: /search/stories
	// threw "fetch failed" mid-grade with no retry, ungrading a
	// correct-answer attempt. Retry policy mirrors teardown's
	// 0/2/4/8s backoff and appends one receipt per attempt.

	it("returns the result on first success without sleeping", async () => {
		const sleepCalls: number[] = [];
		const receipts: Receipt[] = [];
		const result = await withFetchRetry(
			async () => "ok",
			"GET /search/stories",
			receipts,
			async (ms) => {
				sleepCalls.push(ms);
			},
		);
		expect(result).toBe("ok");
		expect(receipts).toHaveLength(1);
		expect(receipts[0]?.endpoint).toMatch(/attempt 1.*delay 0ms.*ok/);
		// Attempt 1's pre-delay is 0ms — sleep is only called when delay > 0.
		expect(sleepCalls).toEqual([]);
	});

	it("retries on transient failure and returns the eventual success", async () => {
		const sleepCalls: number[] = [];
		const receipts: Receipt[] = [];
		let attempts = 0;
		const result = await withFetchRetry(
			async () => {
				attempts++;
				if (attempts < 3) throw new TypeError("fetch failed");
				return { id: 17 };
			},
			'GET /search/stories?query=state:"In Progress"',
			receipts,
			async (ms) => {
				sleepCalls.push(ms);
			},
		);
		expect(result).toEqual({ id: 17 });
		expect(attempts).toBe(3);
		// Three receipts: two errors then one success, in order.
		expect(receipts).toHaveLength(3);
		expect(receipts[0]?.endpoint).toMatch(/attempt 1.*error: fetch failed/);
		expect(receipts[1]?.endpoint).toMatch(/attempt 2.*error: fetch failed/);
		expect(receipts[2]?.endpoint).toMatch(/attempt 3.*ok/);
		// Attempts 2 and 3 slept 2000ms and 4000ms respectively before
		// firing; attempt 1 slept 0.
		expect(sleepCalls).toEqual([2000, 4000]);
	});

	it("re-throws the last error after 4 total attempts (0/2/4/8s)", async () => {
		const sleepCalls: number[] = [];
		const receipts: Receipt[] = [];
		let attempts = 0;
		await expect(
			withFetchRetry(
				async () => {
					attempts++;
					throw new Error(`fail ${attempts}`);
				},
				"GET /stories/999",
				receipts,
				async (ms) => {
					sleepCalls.push(ms);
				},
			),
		).rejects.toThrow("fail 4");
		expect(attempts).toBe(4);
		expect(receipts).toHaveLength(4);
		expect(sleepCalls).toEqual([2000, 4000, 8000]);
	});

	it("appends receipts with the caller's endpoint string preserved", async () => {
		const receipts: Receipt[] = [];
		await withFetchRetry(
			async () => 1,
			'GET /search/stories?query=name:"Fixture 42"',
			receipts,
			async () => {},
		);
		expect(receipts[0]?.endpoint).toContain(
			'GET /search/stories?query=name:"Fixture 42"',
		);
	});
});
