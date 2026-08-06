import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const token = process.env.SHORTCUT_API_TOKEN;
if (!token) throw new Error("SHORTCUT_API_TOKEN is not set");

const SHORTCUT_API = "https://api.app.shortcut.com/api/v3";
const AUTH_HEADERS = { "Shortcut-Token": token };

async function shortcut<T>(path: string): Promise<T> {
	const res = await fetch(`${SHORTCUT_API}${path}`, { headers: AUTH_HEADERS });
	if (!res.ok) {
		const body = await res.text();
		throw new Error(
			`Shortcut ${res.status} ${res.statusText}: ${body.slice(0, 200)}`,
		);
	}
	return (await res.json()) as T;
}

type Member = {
	id: string;
	name: string;
	mention_name: string;
};

const server = new McpServer({
	name: "shortcut-handbuilt",
	version: "0.0.0",
});

server.tool(
	"whoami",
	'Return the current Shortcut user identified by this server\'s API token. Use at the start of any chore that refers to the caller as "me" — my stories, assign me as owner, mention me — because the Shortcut API only accepts ids, not the word me. Returns id, name, and mention_name.',
	async () => {
		const me = await shortcut<Member>("/member");
		return {
			content: [
				{
					type: "text",
					text: JSON.stringify({
						id: me.id,
						name: me.name,
						mention_name: me.mention_name,
					}),
				},
			],
		};
	},
);

const transport = new StdioServerTransport();
await server.connect(transport);
