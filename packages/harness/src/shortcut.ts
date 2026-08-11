// Thin Shortcut REST client for baseline / setup / teardown / graders.
// Distinct from the MCP server in servers/shortcut-handbuilt/: the
// harness must verify ground truth against Shortcut directly, not
// through any lane.

const API = "https://api.app.shortcut.com/api/v3";

function authHeaders(token: string): Record<string, string> {
	return { "Shortcut-Token": token };
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

export async function fetchTeamStories(
	token: string,
	teamMentionName: string,
): Promise<LiveStory[]> {
	const url = `${API}/search/stories?query=${encodeURIComponent(`team:${teamMentionName}`)}&page_size=100`;
	const res = await fetch(url, { headers: authHeaders(token) });
	if (!res.ok) throw new Error(`Shortcut ${res.status}: ${await res.text()}`);
	const data = (await res.json()) as { data: LiveStory[] };
	return data.data;
}

// Workspace-wide title search, no team filter. Team membership is a
// grader assertion, not a search scope — teamless stories must remain
// findable so the grader can name the missing team as a failure.
export async function searchByName(
	token: string,
	title: string,
): Promise<LiveStory[]> {
	const q = encodeURIComponent(`name:"${title.replace(/"/g, '\\"')}"`);
	const url = `${API}/search/stories?query=${q}&page_size=25`;
	const res = await fetch(url, { headers: authHeaders(token) });
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
	const res = await fetch(url, { headers: authHeaders(token) });
	if (!res.ok) throw new Error(`Shortcut ${res.status}: ${await res.text()}`);
	const data = (await res.json()) as { data: LiveStory[] };
	return data.data;
}

export async function fetchStory(
	token: string,
	id: number,
): Promise<LiveStory | null> {
	const res = await fetch(`${API}/stories/${id}`, {
		headers: authHeaders(token),
	});
	if (res.status === 404) return null;
	if (!res.ok) throw new Error(`Shortcut ${res.status}: ${await res.text()}`);
	return (await res.json()) as LiveStory;
}

export async function deleteStory(token: string, id: number): Promise<number> {
	const res = await fetch(`${API}/stories/${id}`, {
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
	const res = await fetch(`${API}/stories/${id}`, {
		headers: authHeaders(token),
	});
	if (res.status === 404) return null;
	if (!res.ok) throw new Error(`Shortcut ${res.status}: ${await res.text()}`);
	return (await res.json()) as LiveStoryFull;
}

export async function fetchWorkflows(token: string): Promise<Workflow[]> {
	const res = await fetch(`${API}/workflows`, { headers: authHeaders(token) });
	if (!res.ok) throw new Error(`Shortcut ${res.status}: ${await res.text()}`);
	return (await res.json()) as Workflow[];
}

export async function fetchCustomFields(token: string): Promise<CustomField[]> {
	const res = await fetch(`${API}/custom-fields`, {
		headers: authHeaders(token),
	});
	if (!res.ok) throw new Error(`Shortcut ${res.status}: ${await res.text()}`);
	return (await res.json()) as CustomField[];
}

export async function fetchSelf(token: string): Promise<Member> {
	const res = await fetch(`${API}/member`, { headers: authHeaders(token) });
	if (!res.ok) throw new Error(`Shortcut ${res.status}: ${await res.text()}`);
	return (await res.json()) as Member;
}

export async function fetchGroups(token: string): Promise<Group[]> {
	const res = await fetch(`${API}/groups`, { headers: authHeaders(token) });
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
	const res = await fetch(`${API}/stories`, {
		method: "POST",
		headers: { ...authHeaders(token), "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
	if (!res.ok) throw new Error(`Shortcut ${res.status}: ${await res.text()}`);
	return (await res.json()) as LiveStoryFull;
}
