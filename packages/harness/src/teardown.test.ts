import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { runTeardown } from "./teardown.js";

// L7-fix (2026-08-18): sc-570 slipped past the search-based teardown
// because Shortcut's /search/stories is index-lagged. Teardown is now
// id-first: fixtures + every id harvested from transcript
// tool_result bodies get direct-GET verified after delete. Direct id
// reads are not index-lagged.
//
// The critical test below simulates that exact failure mode: an
// agent-created id (sc-570) is invisible to the post-attempt search
// snapshot but must still be deleted and its absence directly
// verified.

// Baseline stories the workspace should return to. Matches
// baseline.ts BASELINE_STORIES ids so checkBaseline() approves the
// snapshot. Titles / states / epics chosen to satisfy every
// property-drift check in checkBaseline.
const BASELINE_JSON = {
	data: [
		{
			id: 17,
			name: "Get Started with Shortcut",
			workflow_state_id: 500000008,
			epic_id: 16,
			story_type: "feature",
		},
		{
			id: 18,
			name: "Break work down in the Shortcut Way",
			workflow_state_id: 500000007,
			epic_id: 16,
			story_type: "chore",
		},
		{
			id: 19,
			name: "Automate with GitHub or GitLab",
			workflow_state_id: 500000010,
			epic_id: 16,
			story_type: "chore",
		},
		{
			id: 20,
			name: "Customize for your Team",
			workflow_state_id: 500000007,
			epic_id: 16,
			story_type: "chore",
		},
		{
			id: 21,
			name: "Share Progress with the Roadmap",
			workflow_state_id: 500000007,
			epic_id: 16,
			story_type: "chore",
		},
		{
			id: 22,
			name: "Connect in Slack",
			workflow_state_id: 500000007,
			epic_id: 16,
			story_type: "chore",
		},
		{
			id: 23,
			name: "Accelerate your team with Agents",
			workflow_state_id: 500000009,
			epic_id: 16,
			story_type: "chore",
		},
		{
			id: 24,
			name: "Invite your team",
			workflow_state_id: 500000007,
			epic_id: 16,
			story_type: "chore",
		},
		{
			id: 25,
			name: "What's next?",
			workflow_state_id: 500000007,
			epic_id: 16,
			story_type: "chore",
		},
		{
			id: 30,
			name: "Connect in Slack",
			workflow_state_id: 500000006,
			epic_id: null,
			story_type: "feature",
		},
	],
};

function jsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

function stub404(): Response {
	return new Response(null, { status: 404 });
}

function stub204(): Response {
	// Fetch spec: 204/205/304 must have a null body. Passing "" throws
	// in undici's Response constructor.
	return new Response(null, { status: 204 });
}

describe("runTeardown (id-first, L7-lag safe)", () => {
	let fetchMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		fetchMock = vi.fn();
		vi.stubGlobal("fetch", fetchMock);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("deletes and verifies a transcript-harvested id that search cannot see", async () => {
		// Scenario mirrors Terra full-run sc-570: harvestedIds includes 570
		// (from the agent's create_story tool_result), preIds is baseline
		// only, and the post-attempt search snapshot returns ONLY the
		// baseline stories (index-lag hides sc-570). Teardown must still
		// delete and verify sc-570.

		const harvestedIds = new Set<number>([570]);
		const preIds = new Set<number>(BASELINE_JSON.data.map((s) => s.id));

		let getCalls = 0;
		fetchMock.mockImplementation((url: string, init?: RequestInit) => {
			const method = init?.method ?? "GET";
			if (url.includes("/stories/570") && method === "DELETE") {
				return Promise.resolve(stub204());
			}
			if (url.includes("/stories/570") && method === "GET") {
				getCalls++;
				// Call 1 = capture (returns story); call 2 = verify (404).
				if (getCalls === 1) {
					return Promise.resolve(
						jsonResponse({
							id: 570,
							name: "Deploy hotfix",
							workflow_state_id: 500000007,
							epic_id: null,
							story_type: "chore",
						}),
					);
				}
				return Promise.resolve(stub404());
			}
			if (url.includes("/search/stories?query=is%3Astory")) {
				// Post-attempt snapshot AND baseline re-verify both hit this.
				// L7 lag: sc-570 is missing from both.
				return Promise.resolve(jsonResponse(BASELINE_JSON));
			}
			throw new Error(`unexpected fetch: ${method} ${url}`);
		});

		const record = await runTeardown(
			[],
			preIds,
			harvestedIds,
			"tok",
			async () => {},
		);

		// The core L7 assertion: sc-570 was deleted AND verified absent
		// via direct GET, even though the search snapshot never saw it.
		expect(record.deletions).toEqual([{ id: 570, http_status: 204 }]);
		expect(record.verified_absent).toEqual([570]);
		expect(record.errors).toEqual([]);
		expect(record.baseline_reverify.ok).toBe(true);
		expect(record.baseline_reverify.issues).toEqual([]);

		// The verify GET was made (not just the capture-before-delete GET).
		const storyGets = fetchMock.mock.calls.filter(
			(c) =>
				String(c[0]).includes("/stories/570") &&
				(c[1]?.method ?? "GET") === "GET",
		);
		expect(storyGets.length).toBe(2);
	});

	it("catches agent-created strays not present in harvestedIds via the search safety net", async () => {
		// Scenario: agent created sc-999 but the tool_result body was
		// mangled so harvestStoryIds missed it. The post-attempt search
		// snapshot DOES see it (this stray's index has caught up).
		// Teardown must still catch and delete it via the belt-and-braces
		// sweep.

		const harvestedIds = new Set<number>();
		const preIds = new Set<number>(BASELINE_JSON.data.map((s) => s.id));
		const snapshotWithStray = {
			data: [
				...BASELINE_JSON.data,
				{
					id: 999,
					name: "Stray",
					workflow_state_id: 500000007,
					epic_id: null,
					story_type: "chore",
				},
			],
		};
		let getCalls999 = 0;
		let searchCallCount = 0;
		fetchMock.mockImplementation((url: string, init?: RequestInit) => {
			const method = init?.method ?? "GET";
			if (url.includes("/stories/999") && method === "DELETE") {
				return Promise.resolve(stub204());
			}
			if (url.includes("/stories/999") && method === "GET") {
				getCalls999++;
				// Call 1 = capture (returns story); call 2 = verify (404).
				if (getCalls999 === 1) {
					return Promise.resolve(
						jsonResponse({
							id: 999,
							name: "Stray",
							workflow_state_id: 500000007,
							epic_id: null,
							story_type: "chore",
						}),
					);
				}
				return Promise.resolve(stub404());
			}
			if (url.includes("/search/stories?query=is%3Astory")) {
				searchCallCount++;
				// Call 1 = post-attempt snapshot (sees the stray).
				// Call 2 = baseline re-verify (stray gone).
				if (searchCallCount === 1) {
					return Promise.resolve(jsonResponse(snapshotWithStray));
				}
				return Promise.resolve(jsonResponse(BASELINE_JSON));
			}
			throw new Error(`unexpected fetch: ${method} ${url}`);
		});

		const record = await runTeardown(
			[],
			preIds,
			harvestedIds,
			"tok",
			async () => {},
		);
		expect(record.deletions).toEqual([{ id: 999, http_status: 204 }]);
		expect(record.verified_absent).toEqual([999]);
		expect(record.baseline_reverify.ok).toBe(true);
	});

	it("no-op teardown when nothing was created — no strays, no fixtures", async () => {
		const preIds = new Set<number>(BASELINE_JSON.data.map((s) => s.id));
		fetchMock.mockImplementation((url: string) => {
			if (url.includes("/search/stories?query=is%3Astory")) {
				return Promise.resolve(jsonResponse(BASELINE_JSON));
			}
			throw new Error(`unexpected fetch: ${url}`);
		});
		const record = await runTeardown(
			[],
			preIds,
			new Set<number>(),
			"tok",
			async () => {},
		);
		expect(record.deletions).toEqual([]);
		expect(record.verified_absent).toEqual([]);
		expect(record.baseline_reverify.ok).toBe(true);
	});

	it("baseline_reverify.ok=false if a deletion cannot be verified absent (unlikely, but caught)", async () => {
		// Deleted sc-570, but every subsequent GET keeps returning 200.
		// Verify's bounded retry exhausts and throws; teardown records the
		// error and baseline_reverify.ok stays false. (In practice this
		// would mean Shortcut's DELETE returned 204 but the read layer is
		// showing a stale cache — extreme edge case; we just don't lie
		// about it.)
		const harvestedIds = new Set<number>([570]);
		const preIds = new Set<number>(BASELINE_JSON.data.map((s) => s.id));
		fetchMock.mockImplementation((url: string, init?: RequestInit) => {
			const method = init?.method ?? "GET";
			if (url.includes("/stories/570") && method === "DELETE") {
				return Promise.resolve(stub204());
			}
			if (url.includes("/stories/570") && method === "GET") {
				return Promise.resolve(
					jsonResponse({
						id: 570,
						name: "Deploy hotfix",
						workflow_state_id: 500000007,
						epic_id: null,
						story_type: "chore",
					}),
				);
			}
			if (url.includes("/search/stories?query=is%3Astory")) {
				return Promise.resolve(jsonResponse(BASELINE_JSON));
			}
			throw new Error(`unexpected fetch: ${method} ${url}`);
		});
		const record = await runTeardown(
			[],
			preIds,
			harvestedIds,
			"tok",
			async () => {}, // instant sleep — retries burn through immediately
		);
		expect(record.deletions).toEqual([{ id: 570, http_status: 204 }]);
		expect(record.verified_absent).toEqual([]);
		expect(record.errors.length).toBe(1);
		expect(record.errors[0]).toMatch(/still returns 200/);
		// Deletion happened but verify failed — baseline_reverify still
		// flags it via the deletions-vs-verified reconciliation.
		expect(record.baseline_reverify.ok).toBe(false);
		expect(record.baseline_reverify.issues).toContain(
			"sc-570 deleted but not verified absent",
		);
	});
});
