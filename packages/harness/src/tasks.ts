import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { z } from "zod";

// Schema derived field-by-field from docs/specs/golden-task-format.md.
// Strict everywhere: unknown keys are rejected per the spec's closed
// vocabulary rule. New keys must land in the spec before the schema.

const TaskClass = z.enum([
	"state-trap",
	"duplicate-check",
	"orientation",
	"write",
	"info-vs-cost",
	"hierarchy",
]);

const SetupFixture = z
	.object({
		ref: z.string().optional(),
		title: z.string(),
		state: z.string(),
		story_type: z.string(),
		priority: z.string().optional(),
	})
	.strict();

const ExpectedTools = z.record(z.string(), z.array(z.string()));

const DeadlineWithin = z
	.object({
		date: z.string(),
		timezone: z.string(),
	})
	.strict();

const StoryExistsInner = z
	.object({
		title: z.string(),
		state_name: z.string().optional(),
		story_type: z.string().optional(),
		owner_is_self: z.boolean().optional(),
		team: z.string().optional(),
		deadline_within: DeadlineWithin.optional(),
		// spec: "tasks (list, tolerances apply)"; interpreted as an
		// array of task description strings pending clarification.
		tasks: z.array(z.string()).optional(),
		description_contains: z.string().optional(),
	})
	.strict();

const StoryAbsentInner = z
	.object({
		title: z.string(),
	})
	.strict();

const CommentOnInner = z
	.object({
		// spec: "story ref"; interpreted as either a setup.ref name
		// or a numeric story id, pending clarification.
		story: z.union([z.string(), z.number()]),
		text_contains: z.string(),
	})
	.strict();

const AnswerIdsInner = z
	.object({
		equals_state: z.string().optional(),
		equals_fixture: z.string().optional(),
	})
	.strict()
	.refine((val) => Object.keys(val).length === 1, {
		message:
			"answer_ids must have exactly one of equals_state or equals_fixture",
	});

// A grade check is a single-shape strict object where every check-key
// is optional; the refine below enforces "exactly one key present" so
// each item in the grade array behaves like a tagged variant. Because
// the wrapper is strict and each inner schema is strict, unknown keys
// at either level produce a full path (e.g. grade.0.story_exists.bogus).
const GradeCheck = z
	.object({
		story_exists: StoryExistsInner.optional(),
		story_absent: StoryAbsentInner.optional(),
		comment_on: CommentOnInner.optional(),
		answer_ids: AnswerIdsInner.optional(),
		workspace_unchanged: z.boolean().optional(),
	})
	.strict()
	.refine((val) => Object.keys(val).length === 1, {
		message: "grade check must have exactly one key",
	});

const Tolerances = z
	.object({
		casing: z.enum(["insensitive", "exact"]).optional(),
		date_window: z
			.object({
				timezone: z.string(),
			})
			.strict()
			.optional(),
	})
	.strict();

export const GoldenTaskSchema = z
	.object({
		id: z.string(),
		class: TaskClass,
		prompt: z.string(),
		setup: z.array(SetupFixture).optional(),
		expected_tools: ExpectedTools.optional(),
		grade: z.array(GradeCheck),
		tolerances: Tolerances.optional(),
		provenance: z.literal("ai-drafted, human-reviewed"),
		notes: z.string().optional(),
	})
	.strict();

export type GoldenTask = z.infer<typeof GoldenTaskSchema>;

export type LoadResult =
	| { file: string; ok: true; task: GoldenTask }
	| { file: string; ok: false; errors: string[] };

export function loadTaskFile(path: string): LoadResult {
	const raw = readFileSync(path, "utf8");
	let parsed: unknown;
	try {
		parsed = parse(raw);
	} catch (e) {
		return {
			file: path,
			ok: false,
			errors: [`yaml parse: ${(e as Error).message}`],
		};
	}
	const result = GoldenTaskSchema.safeParse(parsed);
	if (result.success) return { file: path, ok: true, task: result.data };
	const errors = result.error.issues.map((i) => {
		const pathStr = i.path.length > 0 ? i.path.join(".") : "<root>";
		return `${pathStr}: ${i.message}`;
	});
	return { file: path, ok: false, errors };
}

export function loadTasksDir(dir: string): LoadResult[] {
	let entries: string[];
	try {
		entries = readdirSync(dir);
	} catch (e) {
		return [
			{ file: dir, ok: false, errors: [`readdir: ${(e as Error).message}`] },
		];
	}
	return entries
		.filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"))
		.sort()
		.map((entry) => loadTaskFile(join(dir, entry)));
}
