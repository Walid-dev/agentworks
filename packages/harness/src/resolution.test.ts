import { describe, expect, it, vi } from "vitest";
import {
	checkStoryExists,
	type GradeInputs,
	harvestStoryIds,
	resolveByNameWithRetry,
	type TranscriptEvent,
} from "./graders.js";
import type { LiveStory, LiveStoryFull } from "./shortcut.js";
import type { Vocabulary } from "./vocabulary.js";
import type { Workspace } from "./workspace.js";

// Resolution tests: cover harvestStoryIds (id-first), resolveByNameWithRetry
// (search fallback with bounded logged retries), and the assembled
// story_exists check on a teamless story (must fail naming the team
// field). The Workspace interface is a small seam here — no live REST.

const dummyTask = {
	id: "t",
	class: "write" as const,
	prompt: "p",
	grade: [] as never[],
	provenance: "ai-drafted, human-reviewed" as const,
};

function makeInputs(events: TranscriptEvent[]): GradeInputs {
	return {
		task: dummyTask,
		events,
		fixtures: [],
		preIds: new Set(),
		postIds: new Set(),
		runStamp: "STAMP",
		laneId: "test-lane",
		token: "unused",
	};
}

function makeVocab(): Vocabulary {
	return {
		workflows: [],
		groups: [
			{
				id: "team-abc",
				name: "Walid Hl's Team",
				mention_name: "walid-hls-team",
			},
		],
		self: {
			id: "self-1",
			name: "Walid",
			mention_name: "walid",
		},
		customFields: [],
		stateIdByName: new Map(),
		stateNameById: new Map(),
	};
}

function fullStory(overrides: Partial<LiveStoryFull>): LiveStoryFull {
	return {
		id: 100,
		name: "Deadline probe X",
		workflow_state_id: 500000007,
		epic_id: null,
		story_type: "chore",
		deadline: null,
		owner_ids: [],
		group_id: "team-abc",
		description: "",
		tasks: [],
		comments: [],
		...overrides,
	};
}

describe("harvestStoryIds", () => {
	it("extracts id from a curated tool_result (compact JSON)", () => {
		const ev: TranscriptEvent = {
			type: "tool_result",
			name: "create_story",
			is_error: false,
			output: {
				content: [
					{
						type: "text",
						text: JSON.stringify({
							id: 78,
							title: "Deadline probe X",
							state: "To Do",
						}),
					},
				],
			},
		};
		expect([...harvestStoryIds([ev])]).toEqual([78]);
	});

	it("extracts id from a naive tool_result (API Response prefix)", () => {
		const ev: TranscriptEvent = {
			type: "tool_result",
			name: "createStory",
			is_error: false,
			output: {
				content: [
					{
						type: "text",
						text: 'API Response (Status: 201):\n{"id":79,"name":"Deadline probe X","group_id":null}',
					},
				],
			},
		};
		expect([...harvestStoryIds([ev])]).toEqual([79]);
	});

	it("ignores tool_result marked is_error", () => {
		const ev: TranscriptEvent = {
			type: "tool_result",
			name: "create_story",
			is_error: true,
			output: {
				content: [{ type: "text", text: '{"id":99}' }],
			},
		};
		expect([...harvestStoryIds([ev])]).toEqual([]);
	});

	it("ignores string ids (member.id shape)", () => {
		const ev: TranscriptEvent = {
			type: "tool_result",
			name: "whoami",
			is_error: false,
			output: {
				content: [{ type: "text", text: '{"id":"6a74-abc","name":"Walid"}' }],
			},
		};
		expect([...harvestStoryIds([ev])]).toEqual([]);
	});

	it("deduplicates ids across multiple tool_results", () => {
		const ev1: TranscriptEvent = {
			type: "tool_result",
			name: "get_story",
			is_error: false,
			output: { content: [{ type: "text", text: '{"id":17,"name":"X"}' }] },
		};
		const ev2: TranscriptEvent = {
			type: "tool_result",
			name: "get_story",
			is_error: false,
			output: { content: [{ type: "text", text: '{"id":17,"name":"X"}' }] },
		};
		expect([...harvestStoryIds([ev1, ev2])]).toEqual([17]);
	});

	it("ignores non-JSON text (e.g. list_workspace_vocabulary human string)", () => {
		const ev: TranscriptEvent = {
			type: "tool_result",
			name: "note",
			is_error: false,
			output: {
				content: [{ type: "text", text: "some free-form note" }],
			},
		};
		expect([...harvestStoryIds([ev])]).toEqual([]);
	});
});

describe("resolveByNameWithRetry (search fallback with bounded backoff)", () => {
	function fakeSleep() {
		const calls: number[] = [];
		const fn = vi.fn().mockImplementation(async (ms: number) => {
			calls.push(ms);
		});
		return { calls, fn };
	}

	it("returns hit on first attempt when search hits immediately", async () => {
		const story: LiveStory = {
			id: 17,
			name: "Deadline probe X",
			workflow_state_id: 500000007,
			epic_id: null,
			story_type: "chore",
		};
		const ws: Workspace = {
			searchByName: vi.fn().mockResolvedValue([story]),
			fetchStory: vi.fn().mockResolvedValue(fullStory({ id: 17 })),
		};
		const receipts: { endpoint: string; at: string }[] = [];
		const { fn: sleep, calls } = fakeSleep();
		const out = await resolveByNameWithRetry(
			ws,
			"Deadline probe X",
			"insensitive",
			receipts,
			sleep,
		);
		expect(out.kind).toBe("hit");
		expect(ws.searchByName).toHaveBeenCalledTimes(1);
		expect(calls).toEqual([]);
	});

	it("retries three times with delays 2s/4s/8s then misses", async () => {
		const ws: Workspace = {
			searchByName: vi.fn().mockResolvedValue([]),
			fetchStory: vi.fn(),
		};
		const receipts: { endpoint: string; at: string }[] = [];
		const { fn: sleep, calls } = fakeSleep();
		const out = await resolveByNameWithRetry(
			ws,
			"nothing",
			"insensitive",
			receipts,
			sleep,
		);
		expect(out.kind).toBe("miss");
		expect(ws.searchByName).toHaveBeenCalledTimes(4);
		expect(calls).toEqual([2000, 4000, 8000]);
		expect(receipts).toHaveLength(4);
		for (const r of receipts) expect(r.endpoint).toMatch(/attempt \d, delay/);
	});

	it("hits on retry after initial miss (propagation delay case)", async () => {
		const story: LiveStory = {
			id: 42,
			name: "target",
			workflow_state_id: 1,
			epic_id: null,
			story_type: "chore",
		};
		const searchByName = vi
			.fn()
			.mockResolvedValueOnce([])
			.mockResolvedValueOnce([story]);
		const ws: Workspace = {
			searchByName,
			fetchStory: vi.fn().mockResolvedValue(fullStory({ id: 42 })),
		};
		const receipts: { endpoint: string; at: string }[] = [];
		const { fn: sleep } = fakeSleep();
		const out = await resolveByNameWithRetry(
			ws,
			"target",
			"insensitive",
			receipts,
			sleep,
		);
		expect(out.kind).toBe("hit");
		if (out.kind === "hit") expect(out.story.id).toBe(42);
		expect(searchByName).toHaveBeenCalledTimes(2);
	});
});

describe("story_exists on a teamless story (naive-lane failure mode)", () => {
	it("resolves via id-first from the transcript and fails with the team field named", async () => {
		const naiveCreate: TranscriptEvent = {
			type: "tool_result",
			name: "createStory",
			is_error: false,
			output: {
				content: [
					{
						type: "text",
						text: 'API Response (Status: 201):\n{"id":79,"name":"Deadline probe STAMP","group_id":null,"story_type":"chore"}',
					},
				],
			},
		};
		const inputs = makeInputs([naiveCreate]);
		const ws: Workspace = {
			searchByName: vi.fn(),
			fetchStory: vi
				.fn()
				.mockResolvedValue(
					fullStory({ id: 79, name: "Deadline probe STAMP", group_id: null }),
				),
		};
		const result = await checkStoryExists(
			{
				title: "Deadline probe {{run}}",
				team: "Walid Hl's Team",
			},
			inputs,
			makeVocab(),
			ws,
		);
		expect(result.ok).toBe(false);
		expect(result.details.story_id).toBe(79);
		const failures = result.details.failures as string[];
		expect(failures.some((f) => f.includes("team:"))).toBe(true);
		expect(failures.some((f) => f.includes("story has none"))).toBe(true);
		// Search should NOT have been called — id-first resolved first.
		expect(ws.searchByName).not.toHaveBeenCalled();
	});

	it("passes when a teamed story matches (id-first, all field assertions ok)", async () => {
		const curatedCreate: TranscriptEvent = {
			type: "tool_result",
			name: "create_story",
			is_error: false,
			output: {
				content: [
					{
						type: "text",
						text: '{"id":78,"title":"Deadline probe STAMP","state":"To Do","team":"Walid Hl\'s Team","due_date":"2026-08-22T03:59:59Z","url":"..."}',
					},
				],
			},
		};
		const inputs = makeInputs([curatedCreate]);
		const ws: Workspace = {
			searchByName: vi.fn(),
			fetchStory: vi.fn().mockResolvedValue(
				fullStory({
					id: 78,
					name: "Deadline probe STAMP",
					group_id: "team-abc",
					story_type: "chore",
					owner_ids: ["self-1"],
					deadline: "2026-08-22T03:59:59Z",
				}),
			),
		};
		const result = await checkStoryExists(
			{
				title: "Deadline probe {{run}}",
				team: "Walid Hl's Team",
				story_type: "chore",
				owner_is_self: true,
				deadline_within: { date: "2026-08-21", timezone: "America/Toronto" },
			},
			inputs,
			makeVocab(),
			ws,
		);
		expect(result.ok).toBe(true);
		expect(result.details.story_id).toBe(78);
	});
});
