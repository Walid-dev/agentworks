import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import OpenAI from "openai";
import type {
	FunctionTool,
	ResponseCreateParamsNonStreaming,
	ResponseFunctionToolCall,
	ResponseInputItem,
	ResponseOutputItem,
} from "openai/resources/responses/responses";
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

// Runtime C — the OpenAI seat, targeting /v1/responses. Same
// AgentRuntime interface, same MCP stdio client, same amnesiac
// per-attempt lifecycle, same SYSTEM_PROMPT, same turn cap.
// Provider-specific bits stay in this file; the Anthropic
// cache_control breakpoint helpers in runtime.ts do not leak here.
//
// Why /v1/responses instead of /v1/chat/completions: reasoning-family
// models like gpt-5.6-terra reject the combination of function tools
// and any non-'none' reasoning effort on the Chat Completions
// endpoint. The Responses API is where reasoning + tools works.
//
// Reasoning: pinned to `medium` on every request. Medium is the API
// default made explicit, so it is stable across model versions and
// visible in the transcript. Cross-family lane runs the model as
// deployed — see docs/decisions.md.
//
// Prompt caching: OpenAI's Responses API applies automatic prefix
// caching. `usage.input_tokens_details.cached_tokens` reports the
// tokens read from cache and maps into cache_read_input_tokens
// (the same column Runtime A records for Anthropic reads).
// `input_tokens_details.cache_write_tokens` maps into
// cache_creation_input_tokens on newer models that report it.
//
// Multi-turn: uses `previous_response_id` for turn N>1, so the server
// carries the reasoning-item chain. This keeps the client code simple
// and mirrors what a real agent-loop consumer would do. The chain
// terminates at the attempt boundary — no cross-attempt state.

export const OPENAI_REASONING_EFFORT = "medium" as const;

// The shape of a Model-Context-Protocol tool as returned by
// `client.listTools()`.
export type McpToolLike = {
	name: string;
	description?: string;
	inputSchema?: unknown;
};

// Responses-API function tools are FLAT (differs from Chat
// Completions which wraps in {type:'function', function:{...}}).
export function mcpToolsToResponsesTools(tools: McpToolLike[]): FunctionTool[] {
	return tools.map((t) => ({
		type: "function",
		name: t.name,
		description: t.description ?? "",
		parameters: (t.inputSchema ?? {
			type: "object",
			properties: {},
		}) as Record<string, unknown>,
		strict: null,
	}));
}

// The Responses-API usage shape. `cache_write_tokens` is populated on
// gpt-5.6 and later models; older or partial responses may omit it.
export type OpenAIResponsesUsageLike = {
	input_tokens?: number | null;
	input_tokens_details?: {
		cached_tokens?: number | null;
		cache_write_tokens?: number | null;
	} | null;
	output_tokens?: number | null;
	output_tokens_details?: {
		reasoning_tokens?: number | null;
	} | null;
};

export function openaiResponsesUsageToAggregate(
	usage: OpenAIResponsesUsageLike,
): UsageAggregate {
	const cached = usage.input_tokens_details?.cached_tokens ?? 0;
	const cacheWrite = usage.input_tokens_details?.cache_write_tokens ?? 0;
	const inputTotal = usage.input_tokens ?? 0;
	// OpenAI's `input_tokens` includes the cached portion; the
	// uncached, freshly-billed-at-full-rate slice is the remainder.
	const uncached = Math.max(0, inputTotal - cached);
	return {
		input_tokens: uncached,
		output_tokens: usage.output_tokens ?? 0,
		cache_creation_input_tokens: cacheWrite,
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

// Build the initial Responses request (turn 1). Pinned via test:
// targets /v1/responses (`instructions` + `input` + `max_output_tokens`
// + `reasoning.effort`, never `max_tokens` or `max_completion_tokens`).
export function buildOpenAIResponsesInitialRequest(
	driverId: string,
	instructions: string,
	input: string,
	tools: FunctionTool[],
): ResponseCreateParamsNonStreaming {
	return {
		model: driverId,
		instructions,
		input,
		tools,
		max_output_tokens: MAX_TOKENS,
		reasoning: { effort: OPENAI_REASONING_EFFORT },
		store: true,
	};
}

// Build a follow-up request that chains from a prior response via
// previous_response_id. `input` carries the tool-call outputs the
// server needs to continue the reasoning-item chain.
export function buildOpenAIResponsesFollowupRequest(
	driverId: string,
	previousResponseId: string,
	input: ResponseInputItem[],
	tools: FunctionTool[],
): ResponseCreateParamsNonStreaming {
	return {
		model: driverId,
		previous_response_id: previousResponseId,
		input,
		tools,
		max_output_tokens: MAX_TOKENS,
		reasoning: { effort: OPENAI_REASONING_EFFORT },
		store: true,
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
		const tools = mcpToolsToResponsesTools(listed.tools);
		opts.log({
			type: "tools_available",
			count: tools.length,
			names: listed.tools.map((t) => t.name),
			at: new Date().toISOString(),
		});

		assertNoPlaceholder(opts.userPrompt, "runtime userPrompt");
		opts.log({
			type: "user",
			content: opts.userPrompt,
			at: new Date().toISOString(),
		});

		let usage: UsageAggregate = emptyUsageAggregate();
		let finalMessage = "";
		let lastStopReason: string | null = null;
		let turn = 0;
		let previousResponseId: string | null = null;
		let nextTurnInput: ResponseInputItem[] = [];

		while (turn < MAX_TURNS) {
			turn++;
			const request: ResponseCreateParamsNonStreaming =
				turn === 1
					? buildOpenAIResponsesInitialRequest(
							opts.driverId,
							SYSTEM_PROMPT,
							opts.userPrompt,
							tools,
						)
					: buildOpenAIResponsesFollowupRequest(
							opts.driverId,
							// biome-ignore lint/style/noNonNullAssertion: set on turn 1
							previousResponseId!,
							nextTurnInput,
							tools,
						);

			const response = await client.responses.create(request);
			previousResponseId = response.id;
			lastStopReason = response.status ?? null;

			usage = addAggregates(
				usage,
				openaiResponsesUsageToAggregate(
					(response.usage ?? {}) as OpenAIResponsesUsageLike,
				),
			);

			const functionCalls: ResponseFunctionToolCall[] = [];
			let outputText = "";
			for (const item of response.output as ResponseOutputItem[]) {
				if (item.type === "function_call") {
					functionCalls.push(item);
				} else if (item.type === "message" && item.role === "assistant") {
					for (const content of item.content) {
						if (content.type === "output_text") {
							outputText += content.text;
						}
					}
				}
			}

			const reasoningTokens =
				response.usage?.output_tokens_details?.reasoning_tokens ?? 0;

			opts.log({
				type: "assistant",
				turn,
				stop_reason: lastStopReason,
				content: outputText.length > 0 ? outputText : null,
				tool_calls:
					functionCalls.length > 0
						? functionCalls.map((fc) => ({
								id: fc.call_id,
								name: fc.name,
								arguments: fc.arguments,
							}))
						: null,
				reasoning_tokens: reasoningTokens,
				usage: response.usage ?? null,
				at: new Date().toISOString(),
			});

			if (functionCalls.length === 0) {
				finalMessage = outputText;
				break;
			}

			nextTurnInput = [];
			for (const fc of functionCalls) {
				const at = new Date().toISOString();
				let args: Record<string, unknown> = {};
				try {
					args = JSON.parse(fc.arguments);
				} catch {
					// keep args={}; the MCP call will likely fail on schema,
					// which will be recorded as an is_error tool result.
				}
				try {
					const result = await opts.mcp.callTool({
						name: fc.name,
						arguments: args,
					});
					const isError = (result as { isError?: boolean }).isError === true;
					const content = extractText(result);
					opts.log({
						type: "tool_result",
						tool_use_id: fc.call_id,
						name: fc.name,
						input: args,
						output: result,
						is_error: isError,
						at,
					});
					nextTurnInput.push({
						type: "function_call_output",
						call_id: fc.call_id,
						output: content,
					});
				} catch (e) {
					const msg = (e as Error).message;
					opts.log({
						type: "tool_error",
						tool_use_id: fc.call_id,
						name: fc.name,
						input: args,
						error: msg,
						at,
					});
					nextTurnInput.push({
						type: "function_call_output",
						call_id: fc.call_id,
						output: `Error: ${msg}`,
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

// Driver dispatch — pick the runtime, the required env var, and the
// runtime-specific reasoning-effort tag (if any) based on the driver-id
// family. Claude drivers → Anthropic runtime (no reasoning tag); GPT
// drivers → OpenAI Responses runtime with reasoning effort medium
// pinned. New model families get their own runtime and a new prefix
// here.
export function selectRuntime(driverId: string): {
	runtime: AgentRuntime;
	requiredEnv: string;
	reasoningEffort?: string;
} {
	if (driverId.startsWith("claude")) {
		return { runtime: bareLoopRuntime, requiredEnv: "ANTHROPIC_API_KEY" };
	}
	if (driverId.startsWith("gpt")) {
		return {
			runtime: openaiRuntime,
			requiredEnv: "OPENAI_API_KEY",
			reasoningEffort: OPENAI_REASONING_EFFORT,
		};
	}
	throw new Error(
		`unknown driver family for id "${driverId}"; expected prefix "claude" or "gpt"`,
	);
}
