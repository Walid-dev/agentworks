import { z } from "zod";

const token = process.env.SHORTCUT_API_TOKEN;
if (!token) throw new Error("SHORTCUT_API_TOKEN is not set");

const SHORTCUT_API = "https://api.app.shortcut.com/api/v3";
const AUTH_HEADERS = { "Shortcut-Token": token };

type ShortcutInit<T> = {
	method?: "GET" | "POST" | "PUT" | "DELETE";
	body?: unknown;
	schema?: z.ZodType<T>;
};

export async function shortcut<T = unknown>(
	path: string,
	init: ShortcutInit<T> = {},
): Promise<T> {
	const method = init.method ?? "GET";
	const jsonBody =
		init.body !== undefined ? JSON.stringify(init.body) : undefined;
	const headers: Record<string, string> = { ...AUTH_HEADERS };
	if (jsonBody) headers["Content-Type"] = "application/json";
	const res = await fetch(`${SHORTCUT_API}${path}`, {
		method,
		headers,
		body: jsonBody,
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(
			`Shortcut ${res.status} ${res.statusText}: ${text.slice(0, 200)}`,
		);
	}
	const data: unknown = await res.json();
	return init.schema ? init.schema.parse(data) : (data as T);
}

// Response schemas declare only the fields we consume; zod v4 strips extras.
// The /member endpoint returns name and mention_name at the top level, while
// /members returns them under profile — hence two schemas for the same thing.

export const MemberSchema = z.object({
	id: z.string(),
	name: z.string(),
	mention_name: z.string(),
});

export const MemberListItemSchema = z.object({
	id: z.string(),
	profile: z.object({
		name: z.string().nullable(),
		mention_name: z.string().nullable(),
	}),
});

export const WorkflowStateSchema = z.object({
	id: z.number(),
	name: z.string(),
	type: z.string(),
	position: z.number(),
});

export const WorkflowSchema = z.object({
	id: z.number(),
	name: z.string(),
	default_state_id: z.number(),
	states: z.array(WorkflowStateSchema),
});

export const GroupSchema = z.object({
	id: z.string(),
	name: z.string(),
	mention_name: z.string(),
});

// Soft-deleted comments stay in the story's comments array with
// text: null and deleted: true. Verified live against sc-17 which
// carries tombstones from the 2026-08-08 course reset.
export const StoryCommentSchema = z.object({
	id: z.number(),
	text: z.string().nullable(),
	author_id: z.string(),
	created_at: z.string(),
	deleted: z.boolean().optional(),
});

export const StorySchema = z.object({
	id: z.number(),
	name: z.string(),
	description: z.string(),
	story_type: z.string(),
	workflow_state_id: z.number(),
	group_id: z.string().nullable(),
	owner_ids: z.array(z.string()),
	requested_by_id: z.string(),
	deadline: z.string().nullable(),
	app_url: z.string(),
	tasks: z.array(
		z.object({
			id: z.number(),
			description: z.string(),
			complete: z.boolean(),
		}),
	),
	comments: z.array(StoryCommentSchema),
	story_links: z.array(
		z.object({
			id: z.number(),
			verb: z.string(),
			object_id: z.number(),
			subject_id: z.number(),
			type: z.enum(["subject", "object"]),
		}),
	),
});

export const SearchStoriesSchema = z.object({
	data: z.array(StorySchema),
	total: z.number().nullable(),
	next: z.string().nullable(),
});

export type Story = z.infer<typeof StorySchema>;
