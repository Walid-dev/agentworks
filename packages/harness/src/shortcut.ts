// Thin Shortcut REST client for baseline / setup / teardown. Distinct
// from the MCP server in servers/shortcut-handbuilt/: the harness must
// verify ground truth against Shortcut directly, not through any lane.

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
