import { fetchTeamStories, type LiveStory } from "./shortcut.js";

// Documented baseline from docs/reports/naive-first-run.md, verified
// 2026-08-08. The set of stories, their titles, states, epic
// membership, and story_type — exactly this, nothing else.

export const TEAM_MENTION_NAME = "walid-hls-team";

export const BASELINE_STORIES: ReadonlyArray<{
	id: number;
	name: string;
	workflow_state_id: number;
	epic_id: number | null;
	story_type: string;
}> = [
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
];

export type BaselineResult = {
	ok: boolean;
	issues: string[];
	live_count: number;
};

export async function checkBaseline(token: string): Promise<BaselineResult> {
	const live = await fetchTeamStories(token, TEAM_MENTION_NAME);
	const liveIds = new Set(live.map((s) => s.id));
	const expectedIds = new Set(BASELINE_STORIES.map((s) => s.id));
	const issues: string[] = [];

	// Unexpected (dirty) stories.
	for (const story of live) {
		if (!expectedIds.has(story.id)) {
			issues.push(`unexpected story: sc-${story.id} "${story.name}"`);
		}
	}
	// Missing baseline stories.
	for (const expected of BASELINE_STORIES) {
		if (!liveIds.has(expected.id)) {
			issues.push(
				`missing baseline story: sc-${expected.id} "${expected.name}"`,
			);
		}
	}
	// Story field drift (title/state/epic/story_type mismatch on an expected id).
	for (const expected of BASELINE_STORIES) {
		const actual = live.find((s) => s.id === expected.id);
		if (!actual) continue;
		if (actual.name !== expected.name) {
			issues.push(
				`sc-${expected.id} title drift: expected "${expected.name}", got "${actual.name}"`,
			);
		}
		if (actual.workflow_state_id !== expected.workflow_state_id) {
			issues.push(
				`sc-${expected.id} state drift: expected ${expected.workflow_state_id}, got ${actual.workflow_state_id}`,
			);
		}
		if (actual.epic_id !== expected.epic_id) {
			issues.push(
				`sc-${expected.id} epic drift: expected ${expected.epic_id}, got ${actual.epic_id}`,
			);
		}
		if (actual.story_type !== expected.story_type) {
			issues.push(
				`sc-${expected.id} story_type drift: expected ${expected.story_type}, got ${actual.story_type}`,
			);
		}
	}

	return { ok: issues.length === 0, issues, live_count: live.length };
}

// Simple side-effect-free snapshot used by teardown to identify strays
// created during an attempt.
export async function snapshotIdSet(token: string): Promise<Set<number>> {
	const live = await fetchTeamStories(token, TEAM_MENTION_NAME);
	return new Set(live.map((s: LiveStory) => s.id));
}
