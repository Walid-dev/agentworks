import { describe, expect, it } from "vitest";
import { calendarDateInTimezone, casingEqual, extractIds } from "./graders.js";

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
