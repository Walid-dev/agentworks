import { describe, expect, it } from "vitest";
import { SYSTEM_PROMPT } from "./runtime.js";
import { assertNoPlaceholder, substituteRun } from "./setup.js";
import { loadTaskFile } from "./tasks.js";

// Seam tests: the prompt-assembly contract between a task YAML and the
// outbound API payload / workspace write. What we are asserting: no
// value crosses the seam still carrying a `{{...}}` placeholder, and
// the system prompt is a fixed constant identical for every lane.

describe("substituteRun (prompt seam)", () => {
	it("replaces {{run}} with the given stamp", () => {
		const out = substituteRun("Deadline probe {{run}}", "STAMP-42");
		expect(out).toBe("Deadline probe STAMP-42");
	});

	it("replaces all occurrences", () => {
		const out = substituteRun("{{run}} and {{run}} again", "X");
		expect(out).toBe("X and X again");
	});

	it("leaves strings without {{run}} untouched", () => {
		const s = "Which stories are in the In Progress column right now?";
		expect(substituteRun(s, "STAMP")).toBe(s);
	});

	it("does not touch other placeholder names — assertNoPlaceholder catches those", () => {
		const out = substituteRun("Hello {{name}}", "STAMP");
		expect(out).toBe("Hello {{name}}");
		expect(() => assertNoPlaceholder(out, "test")).toThrow(
			/unsubstituted placeholder/,
		);
	});
});

describe("assertNoPlaceholder (seam invariant)", () => {
	it("passes on a substituted string", () => {
		expect(() =>
			assertNoPlaceholder("Deadline probe STAMP-42", "test"),
		).not.toThrow();
	});

	it("throws with the specific placeholder in the message", () => {
		expect(() =>
			assertNoPlaceholder("Hello {{name}} world", "test-context"),
		).toThrow(/{{name}}.*test-context/);
	});

	it("catches nested-brace payloads too", () => {
		expect(() => assertNoPlaceholder("A {{ b }} C", "ctx")).toThrow();
	});
});

describe("SYSTEM_PROMPT (lane-invariant)", () => {
	it("is a fixed string, not lane-parameterized", () => {
		expect(typeof SYSTEM_PROMPT).toBe("string");
		expect(SYSTEM_PROMPT.length).toBeGreaterThan(0);
	});

	it("carries the exact value the harness spec pins", () => {
		expect(SYSTEM_PROMPT).toBe(
			"You operate a Shortcut workspace through the provided tools.",
		);
	});
});

describe("fixture titles carry the run stamp (loaded from YAML)", () => {
	it("pilot-info-vs-cost fixture template contains {{run}}", () => {
		const r = loadTaskFile("tasks/pilot-info-vs-cost.yaml");
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		const setup = r.task.setup;
		expect(setup).toBeDefined();
		expect(setup?.[0]?.title).toMatch(/\{\{run\}\}/);
	});

	it("substituting a fixture template produces a placeholder-free title", () => {
		const r = loadTaskFile("tasks/pilot-info-vs-cost.yaml");
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		const raw = r.task.setup?.[0]?.title ?? "";
		const stamp = "STAMP-XYZ";
		const substituted = substituteRun(raw, stamp);
		expect(substituted).toContain(stamp);
		expect(() => assertNoPlaceholder(substituted, "fixture")).not.toThrow();
	});

	it("pilot-deadline-write prompt substitutes cleanly", () => {
		const r = loadTaskFile("tasks/pilot-deadline-write.yaml");
		expect(r.ok).toBe(true);
		if (!r.ok) return;
		const stamp = "STAMP-DL";
		const substituted = substituteRun(r.task.prompt, stamp);
		expect(substituted).toContain(stamp);
		expect(() => assertNoPlaceholder(substituted, "prompt")).not.toThrow();
	});
});
