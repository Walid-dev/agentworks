import type { Tool } from "@anthropic-ai/sdk/resources/messages";
import { describe, expect, it } from "vitest";
import {
	type AnthropicUsage,
	accumulateUsage,
	buildCachedSystem,
	buildCachedTools,
	emptyUsageAggregate,
	SYSTEM_PROMPT,
} from "./runtime.js";

// Anthropic prompt-caching request-shape tests. Runtime A only:
// Runtime C (OpenAI) uses automatic prefix caching with no
// breakpoints and does not exercise these helpers.

const dummyTool = (name: string): Tool => ({
	name,
	description: "",
	input_schema: { type: "object", properties: {} },
});

describe("buildCachedSystem", () => {
	it("wraps the prompt in a single ephemeral text block", () => {
		const blocks = buildCachedSystem("hello");
		expect(blocks).toEqual([
			{
				type: "text",
				text: "hello",
				cache_control: { type: "ephemeral" },
			},
		]);
	});

	it("carries the exact SYSTEM_PROMPT text through unchanged", () => {
		const [block] = buildCachedSystem(SYSTEM_PROMPT);
		expect(block?.text).toBe(SYSTEM_PROMPT);
	});
});

describe("buildCachedTools", () => {
	it("puts cache_control on the LAST tool only", () => {
		const tools = [dummyTool("a"), dummyTool("b"), dummyTool("c")];
		const cached = buildCachedTools(tools);
		expect(cached).toHaveLength(3);
		expect(cached[0]?.cache_control).toBeUndefined();
		expect(cached[1]?.cache_control).toBeUndefined();
		expect(cached[2]?.cache_control).toEqual({ type: "ephemeral" });
	});

	it("caches the single tool when only one tool is present", () => {
		const cached = buildCachedTools([dummyTool("only")]);
		expect(cached[0]?.cache_control).toEqual({ type: "ephemeral" });
	});

	it("returns an empty array untouched", () => {
		expect(buildCachedTools([])).toEqual([]);
	});

	it("does not mutate the input array", () => {
		const tools = [dummyTool("a"), dummyTool("b")];
		buildCachedTools(tools);
		expect(tools[0]?.cache_control).toBeUndefined();
		expect(tools[1]?.cache_control).toBeUndefined();
	});
});

describe("accumulateUsage (Anthropic usage fields → aggregate)", () => {
	it("adds every usage axis and starts from an empty aggregate", () => {
		const one: AnthropicUsage = {
			input_tokens: 100,
			output_tokens: 50,
			cache_creation_input_tokens: 200,
			cache_read_input_tokens: 0,
		};
		const agg = accumulateUsage(emptyUsageAggregate(), one);
		expect(agg).toEqual({
			input_tokens: 100,
			output_tokens: 50,
			cache_creation_input_tokens: 200,
			cache_read_input_tokens: 0,
		});
	});

	it("carries cache_read across turns (turn 1 writes, turn 2 reads)", () => {
		const turn1: AnthropicUsage = {
			input_tokens: 5,
			output_tokens: 20,
			cache_creation_input_tokens: 3500,
			cache_read_input_tokens: 0,
		};
		const turn2: AnthropicUsage = {
			input_tokens: 30,
			output_tokens: 15,
			cache_creation_input_tokens: 0,
			cache_read_input_tokens: 3500,
		};
		const agg = accumulateUsage(
			accumulateUsage(emptyUsageAggregate(), turn1),
			turn2,
		);
		expect(agg).toEqual({
			input_tokens: 35,
			output_tokens: 35,
			cache_creation_input_tokens: 3500,
			cache_read_input_tokens: 3500,
		});
	});

	it("treats missing cache_* fields as zero (backwards compat)", () => {
		const noCacheFields: AnthropicUsage = {
			input_tokens: 42,
			output_tokens: 7,
		};
		const agg = accumulateUsage(emptyUsageAggregate(), noCacheFields);
		expect(agg.cache_creation_input_tokens).toBe(0);
		expect(agg.cache_read_input_tokens).toBe(0);
		expect(agg.input_tokens).toBe(42);
		expect(agg.output_tokens).toBe(7);
	});

	it("treats explicit null cache_* as zero", () => {
		const nullCache: AnthropicUsage = {
			input_tokens: 1,
			output_tokens: 1,
			cache_creation_input_tokens: null,
			cache_read_input_tokens: null,
		};
		const agg = accumulateUsage(emptyUsageAggregate(), nullCache);
		expect(agg.cache_creation_input_tokens).toBe(0);
		expect(agg.cache_read_input_tokens).toBe(0);
	});
});
