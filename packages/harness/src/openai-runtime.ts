import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import OpenAI from "openai";
import type {
	ChatCompletionCreateParamsNonStreaming,
	ChatCompletionMessageParam,
	ChatCompletionTool,
} from "openai/resources/chat/completions";
import type { Logger } from "./logger.js";
import {
	type AgentRuntime,
	bareLoopRuntime,
	emptyUsageAggregate,
	extractText,
	MAX_TOKENS,
	MAX_TURNS,
	type RuntimeResult,
	SYSTEM_PROMPT,
	type UsageAggregate,
} from "./runtime.js";
import { assertNoPlaceholder } from "./setup.js";

// Runtime C — the OpenAI seat. Same AgentRuntime interface, same MCP
// stdio client, same amnesiac lifecycle, same SYSTEM_PROMPT, same
// turn cap. Provider-specific bits stay in this file; the request
// assembly for Anthropic's cache_control breakpoints stays in
// runtime.ts and does not leak here.
//
// Prompt caching: OpenAI's Chat Completions API applies automatic
// prefix caching without breakpoint annotations. The usage response
// reports cached tokens in `usage.prompt_tokens_details.cached_tokens`;
// we map that into cache_read_input_tokens (same column as Runtime A
// records for Anthropic reads). OpenAI has no separate "cache write"
// cost, so cache_creation_input_tokens stays at 0 for this runtime.

// The shape of a Model-Context-Protocol tool as returned by
// `client.listTools()` — declared locally to avoid pulling the MCP
// types across just for the mapping helper's input type.
export type McpToolLike = {
	name: string;
	description?: string;
	inputSchema?: unknown;
};

// Build the Chat Completions request body. Pinned via test:
// newer OpenAI models (gpt-5.x, reasoning family) reject the
// legacy `max_tokens` parameter and require `max_completion_tokens`.
// Keeping this in a pure helper lets the shape be tested without
// mocking the SDK client.
export function buildOpenAIRequestParams(
	driverId: string,
	messages: ChatCompletionMessageParam[],
	tools: ChatCompletionTool[],
): ChatCompletionCreateParamsNonStreaming {
	return {
		model: driverId,
		max_completion_tokens: MAX_TOKENS,
		messages,
		tools,
	};
}

export function mcpToolsToOpenAI(tools: McpToolLike[]): ChatCompletionTool[] {
	return tools.map((t) => ({
		type: "function",
		function: {
			name: t.name,
			description: t.description ?? "",
			parameters: (t.inputSchema ?? {
				type: "object",
				properties: {},
			}) as Record<string, unknown>,
		},
	}));
}

// The subset of OpenAI's Chat Completions usage payload the runtime
// needs. `prompt_tokens_details.cached_tokens` was added in the
// 2024-10 caching release; earlier or partial responses may omit it.
export type OpenAIUsageLike = {
	prompt_tokens?: number | null;
	completion_tokens?: number | null;
	prompt_tokens_details?: { cached_tokens?: number | null } | null;
};

export function openaiUsageToAggregate(usage: OpenAIUsageLike): UsageAggregate {
	const cached = usage.prompt_tokens_details?.cached_tokens ?? 0;
	const prompt = usage.prompt_tokens ?? 0;
	const uncached = Math.max(0, prompt - cached);
	return {
		input_tokens: uncached,
		output_tokens: usage.completion_tokens ?? 0,
		cache_creation_input_tokens: 0,
		cache_read_input_tokens: cached,
	};
}

function addAggregates(a: UsageAggregate, b: UsageAggregate): UsageAggregate {
	return {
		input_tokens: a.input_tokens + b.input_tokens,
		output_tokens: a.output_tokens + b.output_tokens,
		cache_creation_input_tokens:
			a.cache_creation_input_tokens + b.cache_creation_input_tokens,
		cache_read_input_tokens:
			a.cache_read_input_tokens + b.cache_read_input_tokens,
	};
}

export const openaiRuntime: AgentRuntime = {
	async run(opts: {
		task: unknown;
		userPrompt: string;
		mcp: Client;
		driverId: string;
		log: Logger;
	}): Promise<RuntimeResult> {
		const apiKey = process.env.OPENAI_API_KEY;
		if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
		const client = new OpenAI({ apiKey });

		const listed = await opts.mcp.listTools();
		const tools = mcpToolsToOpenAI(listed.tools);
		opts.log({
			type: "tools_available",
			count: tools.length,
			names: listed.tools.map((t) => t.name),
			at: new Date().toISOString(),
		});

		assertNoPlaceholder(opts.userPrompt, "runtime userPrompt");
		const messages: ChatCompletionMessageParam[] = [
			{ role: "system", content: SYSTEM_PROMPT },
			{ role: "user", content: opts.userPrompt },
		];
		opts.log({
			type: "user",
			content: opts.userPrompt,
			at: new Date().toISOString(),
		});

		let usage: UsageAggregate = emptyUsageAggregate();
		let finalMessage = "";
		let lastStopReason: string | null = null;
		let turn = 0;

		while (turn < MAX_TURNS) {
			turn++;
			const response = await client.chat.completions.create(
				buildOpenAIRequestParams(opts.driverId, messages, tools),
			);
			const choice = response.choices[0];
			if (!choice) throw new Error("openai response has no choices");
			lastStopReason = choice.finish_reason;

			usage = addAggregates(
				usage,
				openaiUsageToAggregate((response.usage ?? {}) as OpenAIUsageLike),
			);

			opts.log({
				type: "assistant",
				turn,
				stop_reason: choice.finish_reason,
				content: choice.message.content,
				tool_calls: choice.message.tool_calls ?? null,
				usage: response.usage ?? null,
				at: new Date().toISOString(),
			});

			messages.push({
				role: "assistant",
				content: choice.message.content ?? "",
				tool_calls: choice.message.tool_calls,
			} as ChatCompletionMessageParam);

			if (choice.finish_reason !== "tool_calls") {
				finalMessage = choice.message.content ?? "";
				break;
			}

			const calls = choice.message.tool_calls ?? [];
			for (const tc of calls) {
				const at = new Date().toISOString();
				// OpenAI's tool_calls come with .type "function" and a
				// function.name/arguments pair. We only expect function
				// calls; skip anything else safely.
				if (tc.type !== "function") continue;
				const name = tc.function.name;
				let args: Record<string, unknown> = {};
				try {
					args = JSON.parse(tc.function.arguments);
				} catch {
					// keep args={}; the MCP call will likely fail on schema
					// which will be recorded as an is_error tool result.
				}
				try {
					const result = await opts.mcp.callTool({
						name,
						arguments: args,
					});
					const isError = (result as { isError?: boolean }).isError === true;
					const content = extractText(result);
					opts.log({
						type: "tool_result",
						tool_use_id: tc.id,
						name,
						input: args,
						output: result,
						is_error: isError,
						at,
					});
					messages.push({
						role: "tool",
						tool_call_id: tc.id,
						content,
					});
				} catch (e) {
					const msg = (e as Error).message;
					opts.log({
						type: "tool_error",
						tool_use_id: tc.id,
						name,
						input: args,
						error: msg,
						at,
					});
					messages.push({
						role: "tool",
						tool_call_id: tc.id,
						content: `Error: ${msg}`,
					});
				}
			}
		}

		return {
			turns: turn,
			final_message: finalMessage,
			stop_reason: lastStopReason,
			input_tokens: usage.input_tokens,
			output_tokens: usage.output_tokens,
			cache_creation_input_tokens: usage.cache_creation_input_tokens,
			cache_read_input_tokens: usage.cache_read_input_tokens,
		};
	},
};

// Driver dispatch — pick the runtime and the required env var based
// on the driver-id family. Claude drivers → Anthropic runtime (with
// prompt caching); GPT drivers → OpenAI runtime (with automatic
// prefix caching). New model families get their own runtime and a
// new prefix here.
export function selectRuntime(driverId: string): {
	runtime: AgentRuntime;
	requiredEnv: string;
} {
	if (driverId.startsWith("claude")) {
		return { runtime: bareLoopRuntime, requiredEnv: "ANTHROPIC_API_KEY" };
	}
	if (driverId.startsWith("gpt")) {
		return { runtime: openaiRuntime, requiredEnv: "OPENAI_API_KEY" };
	}
	throw new Error(
		`unknown driver family for id "${driverId}"; expected prefix "claude" or "gpt"`,
	);
}
