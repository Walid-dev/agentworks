import { describe, expect, it } from "vitest";
import { resolveTeamId } from "./setup.js";

// Fixture team resolution (1.8 gate ruling A): setup either uses the
// task-declared team or falls back to the workspace default. Zero or
// many-team workspaces without an explicit pick must fail loudly, not
// silently create teamless stories the way the pre-fix setup did.

const oneTeamVocab = {
	groups: [
		{ id: "team-abc", name: "Walid Hl's Team", mention_name: "walid-hls-team" },
	],
};

const twoTeamVocab = {
	groups: [
		{ id: "team-abc", name: "Walid Hl's Team", mention_name: "walid-hls-team" },
		{ id: "team-xyz", name: "Ops", mention_name: "ops" },
	],
};

describe("resolveTeamId", () => {
	it("returns the sole team's id when the workspace has exactly one team and no explicit pick", () => {
		expect(resolveTeamId(oneTeamVocab, undefined)).toBe("team-abc");
	});

	it("matches by team name (case-insensitive) when the fixture declares one", () => {
		expect(resolveTeamId(twoTeamVocab, "walid hl's team")).toBe("team-abc");
	});

	it("matches by mention_name too", () => {
		expect(resolveTeamId(twoTeamVocab, "ops")).toBe("team-xyz");
	});

	it("throws with the valid list when the declared name is unknown", () => {
		expect(() => resolveTeamId(twoTeamVocab, "nope")).toThrow(
			/unknown team.*walid-hls-team.*ops/,
		);
	});

	it("throws when the workspace has multiple teams and the fixture declares none", () => {
		expect(() => resolveTeamId(twoTeamVocab, undefined)).toThrow(
			/no team and workspace has 2 teams/,
		);
	});

	it("throws when the workspace has zero teams", () => {
		expect(() => resolveTeamId({ groups: [] }, undefined)).toThrow(
			/no team and workspace has 0 teams/,
		);
	});

	it("exact casing rejects a case-differing declared name", () => {
		expect(() =>
			resolveTeamId(oneTeamVocab, "walid hl's team", "exact"),
		).toThrow(/unknown team/);
	});
});
