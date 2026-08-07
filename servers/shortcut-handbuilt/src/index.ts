import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { MemberSchema, shortcut } from "./shortcut.js";

const SELF = await shortcut("/member", { schema: MemberSchema });

function textResult(value: unknown) {
	return {
		content: [{ type: "text" as const, text: JSON.stringify(value) }],
	};
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

const transport = new StdioServerTransport();
await server.connect(transport);
