import { describe, expect, it } from "vitest";
import {
	buildOpenAIResponsesFollowupRequest,
	buildOpenAIResponsesInitialRequest,
	type McpToolLike,
	mcpToolsToResponsesTools,
	OPENAI_REASONING_EFFORT,
	openaiResponsesUsageToAggregate,
	selectRuntime,
} from "./openai-runtime.js";
import { MAX_TOKENS } from "./runtime.js";

// Shape-mapping tests for Runtime C (Responses API). Pure functions
// only. The live runtime hits the SDK at runtime; here we test the
// MCP-tools → Responses-tools boundary, the usage → four-axis mapping,
// the request-body shape (endpoint discriminator + reasoning pin), and
// the driver-id dispatch.

const mcpTools: McpToolLike[] = [
	{
		name: "whoami",
		description: "return the caller",
		inputSchema: { type: "object", properties: {} },
	},
	{
		name: "get_story",
		description: "read a story by id",
		inputSchema: {
			type: "object",
			properties: { id: { type: "number" } },
			required: ["id"],
		},
	},
];

describe("mcpToolsToResponsesTools (MCP → Responses function-tool schema)", () => {
	it("emits FLAT function tools (name/description/parameters at top level, not nested under function:{})", () => {
		const out = mcpToolsToResponsesTools(mcpTools);
		expect(out).toHaveLength(2);
		expect(out[0]).toEqual({
			type: "function",
			name: "whoami",
			description: "return the caller",
			parameters: { type: "object", properties: {} },
			strict: null,
		});
		// Explicitly assert the Chat-Completions nesting is NOT present.
		expect(out[0]).not.toHaveProperty("function");
		expect(out[1]).toEqual({
			type: "function",
			name: "get_story",
			description: "read a story by id",
			parameters: {
				type: "object",
				properties: { id: { type: "number" } },
				required: ["id"],
			},
			strict: null,
		});
	});

	it("defaults an empty description to ''", () => {
		const out = mcpToolsToResponsesTools([
			{ name: "no_desc", inputSchema: { type: "object", properties: {} } },
		]);
		expect(out[0]?.description).toBe("");
	});

	it("defaults a missing inputSchema to an empty object schema", () => {
		const out = mcpToolsToResponsesTools([{ name: "no_schema" }]);
		expect(out[0]?.parameters).toEqual({
			type: "object",
			properties: {},
		});
	});

	it("preserves ordering (worth pinning even where OpenAI caches automatically)", () => {
		const out = mcpToolsToResponsesTools(mcpTools);
		expect(out.map((t) => t.name)).toEqual(["whoami", "get_story"]);
	});
});

describe("openaiResponsesUsageToAggregate (Responses usage → cache-aware aggregate)", () => {
	it("splits input_tokens into cached vs uncached; carries cache_write and reasoning-inclusive output", () => {
		const agg = openaiResponsesUsageToAggregate({
			input_tokens: 1000,
			input_tokens_details: { cached_tokens: 700, cache_write_tokens: 150 },
			output_tokens: 200,
			output_tokens_details: { reasoning_tokens: 120 },
		});
		expect(agg).toEqual({
			input_tokens: 300,
			output_tokens: 200,
			cache_creation_input_tokens: 150,
			cache_read_input_tokens: 700,
		});
	});

	it("puts everything into input_tokens when nothing is cached", () => {
		const agg = openaiResponsesUsageToAggregate({
			input_tokens: 500,
			input_tokens_details: { cached_tokens: 0, cache_write_tokens: 0 },
			output_tokens: 50,
			output_tokens_details: { reasoning_tokens: 0 },
		});
		expect(agg.input_tokens).toBe(500);
		expect(agg.cache_read_input_tokens).toBe(0);
	});

	it("puts everything into cache_read_input_tokens when the whole prompt was cached", () => {
		const agg = openaiResponsesUsageToAggregate({
			input_tokens: 500,
			input_tokens_details: { cached_tokens: 500, cache_write_tokens: 0 },
			output_tokens: 10,
			output_tokens_details: { reasoning_tokens: 0 },
		});
		expect(agg.input_tokens).toBe(0);
		expect(agg.cache_read_input_tokens).toBe(500);
	});

	it("treats missing input_tokens_details as no cache (older responses)", () => {
		const agg = openaiResponsesUsageToAggregate({
			input_tokens: 100,
			output_tokens: 20,
		});
		expect(agg.input_tokens).toBe(100);
		expect(agg.cache_read_input_tokens).toBe(0);
		expect(agg.cache_creation_input_tokens).toBe(0);
	});

	it("never emits a negative uncached count if cached exceeds input (shouldn't happen, but guarded)", () => {
		const agg = openaiResponsesUsageToAggregate({
			input_tokens: 5,
			input_tokens_details: { cached_tokens: 999, cache_write_tokens: 0 },
			output_tokens: 5,
		});
		expect(agg.input_tokens).toBe(0);
	});

	it("output_tokens carries reasoning-inclusive count (reasoning is billed as output)", () => {
		const agg = openaiResponsesUsageToAggregate({
			input_tokens: 100,
			input_tokens_details: { cached_tokens: 0, cache_write_tokens: 0 },
			output_tokens: 200,
			output_tokens_details: { reasoning_tokens: 150 },
		});
		// The aggregate's output_tokens intentionally includes reasoning
		// tokens (they bill as output). The reasoning-only count is
		// surfaced on assistant events, not in the four-axis aggregate.
		expect(agg.output_tokens).toBe(200);
	});
});

describe("build{Initial,Followup}OpenAIResponsesRequest (Responses request shape)", () => {
	const tools = mcpToolsToResponsesTools([
		{ name: "whoami", inputSchema: { type: "object", properties: {} } },
	]);

	it("initial request targets /v1/responses shape (instructions + input string + tools + max_output_tokens + reasoning.effort medium)", () => {
		const params = buildOpenAIResponsesInitialRequest(
			"gpt-5.6-terra",
			"you are a tool operator",
			"do the thing",
			tools,
		);
		expect(params.model).toBe("gpt-5.6-terra");
		expect(params.instructions).toBe("you are a tool operator");
		expect(params.input).toBe("do the thing");
		expect(params.tools).toBe(tools);
		expect(params).toHaveProperty("max_output_tokens", MAX_TOKENS);
		expect(params.reasoning).toEqual({ effort: "medium" });
	});

	it("initial request carries neither max_tokens nor max_completion_tokens (both belong to /v1/chat/completions)", () => {
		const params = buildOpenAIResponsesInitialRequest(
			"gpt-5.6-terra",
			"sys",
			"hi",
			tools,
		);
		expect(params).not.toHaveProperty("max_tokens");
		expect(params).not.toHaveProperty("max_completion_tokens");
	});

	it("follow-up request chains via previous_response_id and carries function-call outputs as input items", () => {
		const outputs = [
			{
				type: "function_call_output" as const,
				call_id: "call_abc",
				output: "42",
			},
		];
		const params = buildOpenAIResponsesFollowupRequest(
			"gpt-5.6-terra",
			"resp_xyz",
			outputs,
			tools,
		);
		expect(params.model).toBe("gpt-5.6-terra");
		expect(params.previous_response_id).toBe("resp_xyz");
		expect(params.input).toBe(outputs);
		expect(params.tools).toBe(tools);
		expect(params).toHaveProperty("max_output_tokens", MAX_TOKENS);
		expect(params.reasoning).toEqual({ effort: "medium" });
	});

	it("follow-up request also carries neither max_tokens nor max_completion_tokens", () => {
		const params = buildOpenAIResponsesFollowupRequest(
			"gpt-5.6-terra",
			"resp_xyz",
			[],
			tools,
		);
		expect(params).not.toHaveProperty("max_tokens");
		expect(params).not.toHaveProperty("max_completion_tokens");
	});

	it("initial request does NOT carry previous_response_id (that field is follow-up only)", () => {
		const params = buildOpenAIResponsesInitialRequest(
			"gpt-5.6-terra",
			"sys",
			"hi",
			tools,
		);
		expect(params).not.toHaveProperty("previous_response_id");
	});

	it("follow-up request does NOT carry instructions (they persist via previous_response_id)", () => {
		const params = buildOpenAIResponsesFollowupRequest(
			"gpt-5.6-terra",
			"resp_xyz",
			[],
			tools,
		);
		expect(params).not.toHaveProperty("instructions");
	});

	it("exports the pinned reasoning effort as a stable constant (single source of truth for meta.start too)", () => {
		expect(OPENAI_REASONING_EFFORT).toBe("medium");
	});
});

describe("selectRuntime (driver-id family dispatch)", () => {
	it("routes claude-* to Runtime A with ANTHROPIC_API_KEY and no reasoning tag", () => {
		const sel = selectRuntime("claude-sonnet-4-6");
		expect(sel.runtime).toBeDefined();
		expect(sel.requiredEnv).toBe("ANTHROPIC_API_KEY");
		expect(sel.reasoningEffort).toBeUndefined();
	});

	it("routes gpt-* to Runtime C with OPENAI_API_KEY and reasoningEffort='medium' (recorded in meta.start)", () => {
		const sel = selectRuntime("gpt-5.6-terra");
		expect(sel.runtime).toBeDefined();
		expect(sel.requiredEnv).toBe("OPENAI_API_KEY");
		expect(sel.reasoningEffort).toBe("medium");
	});

	it("throws on unknown driver family", () => {
		expect(() => selectRuntime("mistral-large")).toThrow(
			/unknown driver family.*expected prefix "claude" or "gpt"/,
		);
	});

	it("throws on empty driver id", () => {
		expect(() => selectRuntime("")).toThrow(/unknown driver family/);
	});
});
