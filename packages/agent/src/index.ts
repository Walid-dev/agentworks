/**
 * Phase 0, week one: the bare agent loop.
 *
 * Talks to the Anthropic API directly with two toy tools declared,
 * executes tool calls locally, loops until the model answers in plain
 * text, and prints the whole transcript. No frameworks, no MCP, no
 * streaming, no retries.
 */

import Anthropic from "@anthropic-ai/sdk";
import type {
	MessageParam,
	Tool,
	ToolUseBlock,
} from "@anthropic-ai/sdk/resources/messages";

const apiKey = process.env.ANTHROPIC_API_KEY;
const model = process.env.ANTHROPIC_MODEL;
if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
if (!model) throw new Error("ANTHROPIC_MODEL is not set");

const client = new Anthropic({ apiKey });

const tools: Tool[] = [
	{
		name: "get_time",
		description: "Return the current wall-clock time as an ISO-8601 string.",
		input_schema: { type: "object", properties: {} },
	},
	{
		name: "add_minutes",
		description:
			"Add a number of minutes to an ISO-8601 timestamp and return the resulting ISO-8601 timestamp.",
		input_schema: {
			type: "object",
			properties: {
				iso: { type: "string", description: "starting ISO-8601 timestamp" },
				minutes: { type: "number", description: "minutes to add" },
			},
			required: ["iso", "minutes"],
		},
	},
];

function runTool(name: string, input: Record<string, unknown>): string {
	if (name === "get_time") {
		return new Date().toISOString();
	}
	if (name === "add_minutes") {
		const iso = String(input.iso);
		const minutes = Number(input.minutes);
		const t = new Date(iso);
		t.setMinutes(t.getMinutes() + minutes);
		return t.toISOString();
	}
	throw new Error(`unknown tool: ${name}`);
}

const userPrompt =
	process.argv.slice(2).join(" ") || "What time will it be in 90 minutes?";
console.log(`user: ${userPrompt}`);

const messages: MessageParam[] = [{ role: "user", content: userPrompt }];

for (let turn = 0; turn < 10; turn++) {
	const response = await client.messages.create({
		model,
		max_tokens: 1024,
		tools,
		messages,
	});

	messages.push({ role: "assistant", content: response.content });

	for (const block of response.content) {
		if (block.type === "text") {
			console.log(`assistant: ${block.text}`);
		} else if (block.type === "tool_use") {
			console.log(`tool_call: ${block.name}(${JSON.stringify(block.input)})`);
		}
	}

	if (response.stop_reason !== "tool_use") break;

	const toolUses = response.content.filter(
		(b): b is ToolUseBlock => b.type === "tool_use",
	);
	const toolResults = toolUses.map((tu) => {
		const output = runTool(tu.name, tu.input as Record<string, unknown>);
		console.log(`tool_result[${tu.name}]: ${output}`);
		return {
			type: "tool_result" as const,
			tool_use_id: tu.id,
			content: output,
		};
	});
	messages.push({ role: "user", content: toolResults });
}
