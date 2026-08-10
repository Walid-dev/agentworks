import Anthropic from "@anthropic-ai/sdk";
import type {
	MessageParam,
	TextBlock,
	Tool,
	ToolResultBlockParam,
	ToolUseBlock,
} from "@anthropic-ai/sdk/resources/messages";
import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { Logger } from "./logger.js";
import type { GoldenTask } from "./tasks.js";

// AgentRuntime interface — one seat that plays a golden task against
// one MCP server. Runtime A is the bare loop grown from packages/agent:
// raw @anthropic-ai/sdk, MCP client over stdio, amnesiac per attempt,
// 10-turn cap, identical system prompt for every lane. No frameworks.

export const SYSTEM_PROMPT =
	"You operate a Shortcut workspace through the provided tools.";
export const MAX_TURNS = 10;
export const MAX_TOKENS = 4096;

export type RuntimeResult = {
	turns: number;
	final_message: string;
	stop_reason: string | null;
	input_tokens: number;
	output_tokens: number;
};

export type RuntimeOpts = {
	task: GoldenTask;
	userPrompt: string;
	mcp: Client;
	driverId: string;
	log: Logger;
};

export interface AgentRuntime {
	run(opts: RuntimeOpts): Promise<RuntimeResult>;
}

function extractText(result: unknown): string {
	if (
		typeof result === "object" &&
		result !== null &&
		"content" in result &&
		Array.isArray((result as { content: unknown }).content)
	) {
		const content = (
			result as { content: Array<{ type?: string; text?: string }> }
		).content;
		return content
			.filter((c) => c.type === "text" && typeof c.text === "string")
			.map((c) => c.text as string)
			.join("");
	}
	return JSON.stringify(result);
}

export const bareLoopRuntime: AgentRuntime = {
	async run(opts: RuntimeOpts): Promise<RuntimeResult> {
		const apiKey = process.env.ANTHROPIC_API_KEY;
		if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
		const client = new Anthropic({ apiKey });

		const listed = await opts.mcp.listTools();
		const tools: Tool[] = listed.tools.map((t) => ({
			name: t.name,
			description: t.description ?? "",
			input_schema: (t.inputSchema ?? {
				type: "object",
				properties: {},
			}) as Tool["input_schema"],
		}));
		opts.log({
			type: "tools_available",
			count: tools.length,
			names: tools.map((t) => t.name),
			at: new Date().toISOString(),
		});

		const messages: MessageParam[] = [
			{ role: "user", content: opts.userPrompt },
		];
		opts.log({
			type: "user",
			content: opts.userPrompt,
			at: new Date().toISOString(),
		});

		let inputTokens = 0;
		let outputTokens = 0;
		let finalMessage = "";
		let lastStopReason: string | null = null;
		let turn = 0;

		while (turn < MAX_TURNS) {
			turn++;
			const response = await client.messages.create({
				model: opts.driverId,
				max_tokens: MAX_TOKENS,
				system: SYSTEM_PROMPT,
				tools,
				messages,
			});
			inputTokens += response.usage.input_tokens;
			outputTokens += response.usage.output_tokens;
			lastStopReason = response.stop_reason;
			opts.log({
				type: "assistant",
				turn,
				stop_reason: response.stop_reason,
				content: response.content,
				usage: response.usage,
				at: new Date().toISOString(),
			});

			messages.push({ role: "assistant", content: response.content });

			if (response.stop_reason !== "tool_use") {
				finalMessage = response.content
					.filter((b): b is TextBlock => b.type === "text")
					.map((b) => b.text)
					.join("");
				break;
			}

			const toolUses = response.content.filter(
				(b): b is ToolUseBlock => b.type === "tool_use",
			);
			const toolResults: ToolResultBlockParam[] = [];
			for (const tu of toolUses) {
				const at = new Date().toISOString();
				try {
					const result = await opts.mcp.callTool({
						name: tu.name,
						arguments: tu.input as Record<string, unknown>,
					});
					const isError = (result as { isError?: boolean }).isError === true;
					const content = extractText(result);
					opts.log({
						type: "tool_result",
						tool_use_id: tu.id,
						name: tu.name,
						input: tu.input,
						output: result,
						is_error: isError,
						at,
					});
					toolResults.push({
						type: "tool_result",
						tool_use_id: tu.id,
						content,
						is_error: isError,
					});
				} catch (e) {
					const msg = (e as Error).message;
					opts.log({
						type: "tool_error",
						tool_use_id: tu.id,
						name: tu.name,
						input: tu.input,
						error: msg,
						at,
					});
					toolResults.push({
						type: "tool_result",
						tool_use_id: tu.id,
						content: `Error: ${msg}`,
						is_error: true,
					});
				}
			}
			messages.push({ role: "user", content: toolResults });
		}

		return {
			turns: turn,
			final_message: finalMessage,
			stop_reason: lastStopReason,
			input_tokens: inputTokens,
			output_tokens: outputTokens,
		};
	},
};
