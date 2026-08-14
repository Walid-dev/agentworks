import { describe, expect, it } from "vitest";
import {
	type McpToolLike,
	mcpToolsToOpenAI,
	openaiUsageToAggregate,
	selectRuntime,
} from "./openai-runtime.js";

// Shape-mapping tests for Runtime C — pure functions only. The live
// bareLoopRuntime and openaiRuntime instances hit their SDKs at run
// time; here we test the boundary between MCP and OpenAI, and the
// driver-id dispatch.

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

describe("mcpToolsToOpenAI (MCP → Chat Completions tool schema)", () => {
	it("wraps each tool in {type:'function', function:{name,description,parameters}}", () => {
		const out = mcpToolsToOpenAI(mcpTools);
		expect(out).toHaveLength(2);
		expect(out[0]).toEqual({
			type: "function",
			function: {
				name: "whoami",
				description: "return the caller",
				parameters: { type: "object", properties: {} },
			},
		});
		expect(out[1]).toEqual({
			type: "function",
			function: {
				name: "get_story",
				description: "read a story by id",
				parameters: {
					type: "object",
					properties: { id: { type: "number" } },
					required: ["id"],
				},
			},
		});
	});

	it("defaults an empty description to ''", () => {
		const out = mcpToolsToOpenAI([
			{ name: "no_desc", inputSchema: { type: "object", properties: {} } },
		]);
		expect(out[0]?.function.description).toBe("");
	});

	it("defaults a missing inputSchema to an empty object schema", () => {
		const out = mcpToolsToOpenAI([{ name: "no_schema" }]);
		expect(out[0]?.function.parameters).toEqual({
			type: "object",
			properties: {},
		});
	});

	it("preserves ordering (the caching-relevant property for Anthropic; still worth pinning here)", () => {
		const out = mcpToolsToOpenAI(mcpTools);
		expect(out.map((t) => t.function.name)).toEqual(["whoami", "get_story"]);
	});
});

describe("openaiUsageToAggregate (OpenAI usage → cache-aware aggregate)", () => {
	it("splits prompt_tokens into cached vs uncached", () => {
		const agg = openaiUsageToAggregate({
			prompt_tokens: 1000,
			completion_tokens: 40,
			prompt_tokens_details: { cached_tokens: 700 },
		});
		expect(agg).toEqual({
			input_tokens: 300,
			output_tokens: 40,
			cache_creation_input_tokens: 0,
			cache_read_input_tokens: 700,
		});
	});

	it("puts everything into input_tokens when nothing is cached", () => {
		const agg = openaiUsageToAggregate({
			prompt_tokens: 500,
			completion_tokens: 50,
			prompt_tokens_details: { cached_tokens: 0 },
		});
		expect(agg.input_tokens).toBe(500);
		expect(agg.cache_read_input_tokens).toBe(0);
	});

	it("puts everything into cache_read_input_tokens when the whole prompt was cached", () => {
		const agg = openaiUsageToAggregate({
			prompt_tokens: 500,
			completion_tokens: 10,
			prompt_tokens_details: { cached_tokens: 500 },
		});
		expect(agg.input_tokens).toBe(0);
		expect(agg.cache_read_input_tokens).toBe(500);
	});

	it("treats missing prompt_tokens_details as no cache (older responses)", () => {
		const agg = openaiUsageToAggregate({
			prompt_tokens: 100,
			completion_tokens: 20,
		});
		expect(agg.input_tokens).toBe(100);
		expect(agg.cache_read_input_tokens).toBe(0);
	});

	it("never emits a negative uncached count if cached exceeds prompt (shouldn't happen, but guarded)", () => {
		const agg = openaiUsageToAggregate({
			prompt_tokens: 5,
			completion_tokens: 5,
			prompt_tokens_details: { cached_tokens: 999 },
		});
		expect(agg.input_tokens).toBe(0);
	});

	it("cache_creation_input_tokens stays 0 for OpenAI (no separate write cost)", () => {
		const agg = openaiUsageToAggregate({
			prompt_tokens: 500,
			completion_tokens: 20,
			prompt_tokens_details: { cached_tokens: 100 },
		});
		expect(agg.cache_creation_input_tokens).toBe(0);
	});
});

describe("selectRuntime (driver-id family dispatch)", () => {
	it("routes claude-* to Runtime A with ANTHROPIC_API_KEY", () => {
		const { runtime, requiredEnv } = selectRuntime("claude-sonnet-4-6");
		expect(runtime).toBeDefined();
		expect(requiredEnv).toBe("ANTHROPIC_API_KEY");
	});

	it("routes gpt-* to Runtime C with OPENAI_API_KEY", () => {
		const { runtime, requiredEnv } = selectRuntime("gpt-5.6-terra");
		expect(runtime).toBeDefined();
		expect(requiredEnv).toBe("OPENAI_API_KEY");
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
