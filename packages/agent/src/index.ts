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

// Model and key both required from env — pinning rule forbids silent defaults for the model in use.
// Plain words: like showing your ID before entering. No key, no call, and we always want to know exactly which AI answered.
const apiKey = process.env.ANTHROPIC_API_KEY;
const model = process.env.ANTHROPIC_MODEL;
if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
if (!model) throw new Error("ANTHROPIC_MODEL is not set");

const client = new Anthropic({ apiKey });

// Toy tools stand in for real MCP tools; the loop mechanics are identical either way.
// Plain words: two pretend buttons so we can practise the wiring first, before hooking up the real Shortcut ones.
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

// Local dispatch — in the Phase 1 harness this role belongs to the MCP client.
// Plain words: when the AI asks to press a button, this is the hand that actually presses it.
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

// argv prompt lets the loop double as an ad-hoc probe; default exercises both tools in sequence.
// Plain words: type your own question at the terminal, or we fall back to one that makes the AI use both tools.
const userPrompt =
	process.argv.slice(2).join(" ") || "What time will it be in 90 minutes?";
console.log(`user: ${userPrompt}`);

// The full conversation is resent on every turn — the Messages API is stateless.
// Plain words: the AI forgets everything between calls, so we replay the whole chat each time we speak to it.
const messages: MessageParam[] = [{ role: "user", content: userPrompt }];

// Hard-capped turns: the curriculum stand-in for the runaway guard a real runtime will need.
// Plain words: a safety limit — if the AI gets stuck going in circles, we stop before it burns real money.
for (let turn = 0; turn < 10; turn++) {
	const response = await client.messages.create({
		model,
		max_tokens: 1024,
		tools,
		messages,
	});

	// Push the assistant turn verbatim so tool_use ids round-trip untouched to the next request.
	// Plain words: keep the AI's reply exactly as it came, including the little tags it uses to match questions with answers.
	messages.push({ role: "assistant", content: response.content });

	for (const block of response.content) {
		if (block.type === "text") {
			console.log(`assistant: ${block.text}`);
		} else if (block.type === "tool_use") {
			console.log(`tool_call: ${block.name}(${JSON.stringify(block.input)})`);
		}
	}

	// stop_reason !== "tool_use" means the model produced a final answer; loop exits here.
	// Plain words: if the AI didn't ask to press another button, it's done — we have our answer and we walk away.
	if (response.stop_reason !== "tool_use") break;

	const toolUses = response.content.filter(
		(b): b is ToolUseBlock => b.type === "tool_use",
	);
	// Execute every requested tool and pair each output to its originating tool_use_id.
	// Plain words: the AI can ask for several things at once — we do them all and hand each answer back with the right tag attached.
	const toolResults = toolUses.map((tu) => {
		const output = runTool(tu.name, tu.input as Record<string, unknown>);
		console.log(`tool_result[${tu.name}]: ${output}`);
		return {
			type: "tool_result" as const,
			tool_use_id: tu.id,
			content: output,
		};
	});
	// Tool results travel back as a user-role turn — an Anthropic protocol quirk worth remembering.
	// Plain words: even though it's the tool talking, the API insists we label it as if the user were speaking — that's just the house rule.
	messages.push({ role: "user", content: toolResults });
}
