import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
	GroupSchema,
	MemberListItemSchema,
	MemberSchema,
	SearchStoriesSchema,
	type Story,
	StoryCommentSchema,
	StorySchema,
	shortcut,
	WorkflowSchema,
} from "./shortcut.js";

// Vocabulary fetched once at startup so tools can translate ids to human
// names without extra API calls during a session.

const [SELF, WORKFLOWS, TEAMS, MEMBERS] = await Promise.all([
	shortcut("/member", { schema: MemberSchema }),
	shortcut("/workflows", { schema: z.array(WorkflowSchema) }),
	shortcut("/groups", { schema: z.array(GroupSchema) }),
	shortcut("/members", { schema: z.array(MemberListItemSchema) }),
]);

const STATE_NAME_BY_ID = new Map(
	WORKFLOWS.flatMap((wf) => wf.states.map((s) => [s.id, s.name] as const)),
);
const STATE_ID_BY_NAME_LOWER = new Map(
	WORKFLOWS.flatMap((wf) =>
		wf.states.map((s) => [s.name.toLowerCase(), s.id] as const),
	),
);
const TEAM_NAME_BY_ID = new Map(TEAMS.map((t) => [t.id, t.name] as const));
const MENTION_BY_ID = new Map(
	MEMBERS.map(
		(m) => [m.id, m.profile.mention_name ?? m.profile.name ?? m.id] as const,
	),
);
const MEMBER_ID_BY_MENTION_LOWER = new Map<string, string>();
for (const m of MEMBERS) {
	if (m.profile.mention_name)
		MEMBER_ID_BY_MENTION_LOWER.set(m.profile.mention_name.toLowerCase(), m.id);
}

const FIRST_WORKFLOW = WORKFLOWS[0];
if (!FIRST_WORKFLOW) throw new Error("no workflows found at startup");
const DEFAULT_STATE = FIRST_WORKFLOW.states
	.slice()
	.sort((a, b) => a.position - b.position)[0];
if (!DEFAULT_STATE) throw new Error("workflow has no states");
const DEFAULT_STATE_ID = DEFAULT_STATE.id;

function stateName(id: number): string {
	return STATE_NAME_BY_ID.get(id) ?? `unknown-state(${id})`;
}
function teamName(id: string | null): string | null {
	if (id === null) return null;
	return TEAM_NAME_BY_ID.get(id) ?? `unknown-team(${id})`;
}
function memberName(id: string): string {
	return MENTION_BY_ID.get(id) ?? id;
}

const PAGE_SIZE = 25;

function resolveTeam(input: string): { id: string; mention_name: string } {
	const norm = input.toLowerCase();
	const t = TEAMS.find(
		(x) =>
			x.name.toLowerCase() === norm || x.mention_name.toLowerCase() === norm,
	);
	if (!t) {
		const valid = TEAMS.map((x) => x.mention_name).join(", ");
		throw new Error(`unknown team: ${input}. Valid teams: ${valid}`);
	}
	return t;
}

function resolveState(name: string): string {
	const norm = name.toLowerCase();
	for (const wf of WORKFLOWS) {
		for (const s of wf.states) {
			if (s.name.toLowerCase() === norm) return s.name;
		}
	}
	throw new Error(`unknown state: ${name}. Valid states: ${validStateNames()}`);
}

function resolveStateId(name: string): number {
	const id = STATE_ID_BY_NAME_LOWER.get(name.toLowerCase());
	if (id === undefined) {
		throw new Error(
			`unknown state: ${name}. Valid states: ${validStateNames()}`,
		);
	}
	return id;
}

function resolveMemberId(mention: string): string {
	const id = MEMBER_ID_BY_MENTION_LOWER.get(mention.toLowerCase());
	if (id === undefined) throw new Error(`unknown member: ${mention}`);
	return id;
}

function validStateNames(): string {
	return Array.from(
		new Set(WORKFLOWS.flatMap((wf) => wf.states.map((s) => s.name))),
	).join(", ");
}

function compactStory(s: Story) {
	return {
		id: s.id,
		title: s.name,
		state: stateName(s.workflow_state_id),
		team: teamName(s.group_id),
		due_date: s.deadline,
		url: s.app_url,
	};
}

function groupByState(stories: Story[], canonicalState: string | undefined) {
	const groups: Record<string, ReturnType<typeof compactStory>[]> = {};
	for (const s of stories) {
		const name = stateName(s.workflow_state_id);
		if (canonicalState && name !== canonicalState) continue;
		if (!groups[name]) groups[name] = [];
		groups[name].push(compactStory(s));
	}
	return groups;
}

function fullStory(s: Story) {
	return {
		id: s.id,
		title: s.name,
		state: stateName(s.workflow_state_id),
		story_type: s.story_type,
		team: teamName(s.group_id),
		owners: s.owner_ids.map(memberName),
		requester: memberName(s.requested_by_id),
		due_date: s.deadline,
		description: s.description,
		tasks: s.tasks.map((t) => ({
			description: t.description,
			complete: t.complete,
		})),
		comments: s.comments.map((c) => ({
			author: memberName(c.author_id),
			text: c.text,
			created_at: c.created_at,
		})),
		story_links: s.story_links.map((l) => ({
			verb: l.verb,
			other_story_id: l.subject_id === s.id ? l.object_id : l.subject_id,
		})),
	};
}

function textResult(value: unknown) {
	return {
		content: [{ type: "text" as const, text: JSON.stringify(value) }],
	};
}

async function searchStories(query: string) {
	const path = `/search/stories?query=${encodeURIComponent(query)}&page_size=${PAGE_SIZE}`;
	return shortcut(path, { schema: SearchStoriesSchema });
}

const server = new McpServer({
	name: "shortcut-handbuilt",
	version: "0.0.0",
});

server.tool(
	"whoami",
	'Return the current Shortcut user identified by this server\'s API token. Use at the start of any chore that refers to the caller as "me" — my stories, assign me as owner, mention me — because the Shortcut API only accepts ids, not the word me. Returns id, name, and mention_name.',
	async () =>
		textResult({
			id: SELF.id,
			name: SELF.name,
			mention_name: SELF.mention_name,
		}),
);

server.tool(
	"list_workspace_vocabulary",
	"Return the workspace's teams, workflow states (in order), and story types. Call this before any chore that names a state (moving stories, filtering by state) or a team (creating a story for a team), because state names and team ids are workspace-specific and cannot be guessed. Returns teams (id, name, mention_name), workflows (id, name, ordered states with id, name, type), and story_types.",
	async () =>
		textResult({
			teams: TEAMS.map((t) => ({
				id: t.id,
				name: t.name,
				mention_name: t.mention_name,
			})),
			workflows: WORKFLOWS.map((wf) => ({
				id: wf.id,
				name: wf.name,
				states: wf.states
					.slice()
					.sort((a, b) => a.position - b.position)
					.map((s) => ({ id: s.id, name: s.name, type: s.type })),
			})),
			story_types: ["feature", "bug", "chore"],
		}),
);

server.tool(
	"list_my_stories",
	'Return stories where the caller is an owner, grouped by workflow state. Use for "what am I working on" chores. Optional state filter matches a workflow state name case-insensitively (from list_workspace_vocabulary); throws with the list of valid state names if the name does not match — do not filter by state type since a workspace may have multiple states of the same type. Returns { stories_by_state, total, returned, truncated }; when truncated is true, more stories exist than were returned — narrow the query or filter by state.',
	{
		state: z
			.string()
			.optional()
			.describe(
				"case-insensitive workflow state name; if omitted, returns all states",
			),
	},
	async ({ state }) => {
		const canonicalState = state ? resolveState(state) : undefined;
		const result = await searchStories(`owner:${SELF.mention_name}`);
		return textResult({
			stories_by_state: groupByState(result.data, canonicalState),
			total: result.total,
			returned: result.data.length,
			truncated: result.next !== null,
		});
	},
);

server.tool(
	"list_team_stories",
	"Return stories owned by a team, grouped by workflow state. Use for reviewing another team's board. Team is identified by name or mention_name (case-insensitive, from list_workspace_vocabulary); throws with the list of valid teams if the name does not match. Optional state filter matches a workflow state name case-insensitively; throws with the list of valid state names if the name does not match. Returns { stories_by_state, total, returned, truncated }; when truncated is true, more stories exist than were returned — narrow the query or filter by state.",
	{
		team: z
			.string()
			.describe("team name or mention_name from list_workspace_vocabulary"),
		state: z
			.string()
			.optional()
			.describe(
				"case-insensitive workflow state name; if omitted, returns all states",
			),
	},
	async ({ team, state }) => {
		const t = resolveTeam(team);
		const canonicalState = state ? resolveState(state) : undefined;
		const result = await searchStories(`team:${t.mention_name}`);
		return textResult({
			stories_by_state: groupByState(result.data, canonicalState),
			total: result.total,
			returned: result.data.length,
			truncated: result.next !== null,
		});
	},
);

server.tool(
	"find_stories",
	'Search stories by title words. Matching is tokenized and case-insensitive: the query is treated as one or more word-prefix tokens against the story title, so "automat" matches "Automate" but "lack" does not match "Slack" — the substring must start at a word boundary. Use when the caller refers to a story by topic rather than id. Returns { stories, total, returned, truncated }; each story has id, title, state, team, due_date. When truncated is true, Shortcut has more matches than were returned — narrow the query.',
	{ query: z.string().describe("phrase to match against story titles") },
	async ({ query }) => {
		const result = await searchStories(`title:"${query}"`);
		return textResult({
			stories: result.data.map(compactStory),
			total: result.total,
			returned: result.data.length,
			truncated: result.next !== null,
		});
	},
);

server.tool(
	"get_story",
	'Return one story in full. Use for "open the card and read it" chores after finding an id from list_my_stories, list_team_stories, or find_stories. Returns id, title, state, story_type, team, owners (mention_names), requester (mention_name), due_date, description, tasks (description with complete flag), comments in order (author mention_name, text, created_at), and linked stories (verb + other story id).',
	{ id: z.number().describe("story id") },
	async ({ id }) => {
		const story = await shortcut(`/stories/${id}`, { schema: StorySchema });
		return textResult(fullStory(story));
	},
);

server.tool(
	"create_story",
	"Create a new story in a single atomic call. Shortcut accepts tasks and one linked story inline with the create, so there is no multi-step orchestration and no partial-success state: the whole story lands or nothing does. Team is required (name or mention_name from list_workspace_vocabulary); throws with the list of valid teams if unknown. State is case-insensitive against workflow state names and defaults to the workflow's first state if omitted; throws with valid state names if the provided name is unknown. By default the caller is set as both owner and requester; pass set_me_as_owner or set_me_as_requester false to disable. Returns the compact new story: id, title, state, team, due_date, url.",
	{
		title: z.string().describe("story title"),
		team: z
			.string()
			.describe("team name or mention_name from list_workspace_vocabulary"),
		story_type: z.enum(["feature", "bug", "chore"]),
		description: z.string().optional(),
		state: z
			.string()
			.optional()
			.describe(
				"case-insensitive workflow state name; if omitted, defaults to the workflow's first state",
			),
		due_date: z.string().optional().describe("ISO 8601 timestamp"),
		tasks: z
			.array(z.string())
			.optional()
			.describe("list of task descriptions to attach"),
		linked_story: z
			.object({
				verb: z.enum(["blocks", "duplicates", "relates to"]),
				other_story_id: z.number(),
			})
			.optional(),
		set_me_as_owner: z.boolean().optional().describe("default true"),
		set_me_as_requester: z.boolean().optional().describe("default true"),
	},
	async ({
		title,
		team,
		story_type,
		description,
		state,
		due_date,
		tasks,
		linked_story,
		set_me_as_owner,
		set_me_as_requester,
	}) => {
		const t = resolveTeam(team);
		const workflow_state_id = state ? resolveStateId(state) : DEFAULT_STATE_ID;
		const body: Record<string, unknown> = {
			name: title,
			group_id: t.id,
			story_type,
			workflow_state_id,
		};
		if (description !== undefined) body.description = description;
		if (due_date !== undefined) body.deadline = due_date;
		if (tasks !== undefined && tasks.length > 0) {
			body.tasks = tasks.map((d) => ({ description: d }));
		}
		if (linked_story !== undefined) {
			body.story_links = [
				{ verb: linked_story.verb, object_id: linked_story.other_story_id },
			];
		}
		if (set_me_as_owner !== false) body.owner_ids = [SELF.id];
		if (set_me_as_requester !== false) body.requested_by_id = SELF.id;
		const story = await shortcut("/stories", {
			method: "POST",
			body,
			schema: StorySchema,
		});
		return textResult(compactStory(story));
	},
);

server.tool(
	"move_story",
	"Change a story's workflow state. Separate from update_story because moving is the single most frequent write; a narrow tool with validated state names is far harder to misuse than a generic update. Story id must exist (throws otherwise). State is matched case-insensitively against workflow state names (from list_workspace_vocabulary); throws with the list of valid states if the name does not match. Returns the compact updated story reflecting the new state.",
	{
		id: z.number().describe("story id"),
		state: z.string().describe("target workflow state name"),
	},
	async ({ id, state }) => {
		const workflow_state_id = resolveStateId(state);
		const story = await shortcut(`/stories/${id}`, {
			method: "PUT",
			body: { workflow_state_id },
			schema: StorySchema,
		});
		return textResult(compactStory(story));
	},
);

server.tool(
	"comment_on_story",
	"Add a comment to a story. The routine progress update. Story id must exist (throws otherwise). Returns { story_id, comment_id, author (mention_name), text, created_at }.",
	{
		id: z.number().describe("story id"),
		text: z.string().describe("comment text"),
	},
	async ({ id, text }) => {
		const comment = await shortcut(`/stories/${id}/comments`, {
			method: "POST",
			body: { text },
			schema: StoryCommentSchema,
		});
		return textResult({
			story_id: id,
			comment_id: comment.id,
			author: memberName(comment.author_id),
			text: comment.text,
			created_at: comment.created_at,
		});
	},
);

server.tool(
	"update_story",
	"Edit existing story fields: title, description, due_date (null clears), team (name or mention_name from list_workspace_vocabulary), or owners (list of mention_names; empty array clears all owners). Only provided fields change; omit a field to leave it as-is. Throws if the story id is not found, if the team is unknown, or if any owner mention_name is unknown. To change the workflow state, use move_story. At least one editable field must be provided. Returns the compact updated story.",
	{
		id: z.number().describe("story id"),
		title: z.string().optional().describe("new title"),
		description: z.string().optional().describe("new description body"),
		due_date: z
			.string()
			.nullable()
			.optional()
			.describe("ISO 8601 timestamp; pass null to clear"),
		team: z
			.string()
			.optional()
			.describe("team name or mention_name from list_workspace_vocabulary"),
		owners: z
			.array(z.string())
			.optional()
			.describe("owner mention_names; empty array clears all owners"),
	},
	async ({ id, title, description, due_date, team, owners }) => {
		const body: Record<string, unknown> = {};
		if (title !== undefined) body.name = title;
		if (description !== undefined) body.description = description;
		if (due_date !== undefined) body.deadline = due_date;
		if (team !== undefined) body.group_id = resolveTeam(team).id;
		if (owners !== undefined) body.owner_ids = owners.map(resolveMemberId);
		if (Object.keys(body).length === 0) {
			throw new Error("update_story requires at least one field to change");
		}
		const story = await shortcut(`/stories/${id}`, {
			method: "PUT",
			body,
			schema: StorySchema,
		});
		return textResult(compactStory(story));
	},
);

const transport = new StdioServerTransport();
await server.connect(transport);
