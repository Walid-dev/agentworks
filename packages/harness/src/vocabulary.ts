// Workspace vocabulary the harness needs across setup, graders, and
// teardown: workflow state name/id mappings, custom-field id lookups
// (Priority in particular), the self member, and team groups. Fetched
// on first use per process and cached — the harness runs against one
// workspace at a time, and this data does not change mid-sweep.

import {
	type CustomField,
	fetchCustomFields,
	fetchGroups,
	fetchSelf,
	fetchWorkflows,
	type Group,
	type Member,
	type Workflow,
} from "./shortcut.js";

export type Vocabulary = {
	workflows: Workflow[];
	groups: Group[];
	self: Member;
	customFields: CustomField[];
	stateIdByName: Map<string, number>;
	stateNameById: Map<number, string>;
};

let cached: Vocabulary | undefined;

export async function loadVocabulary(token: string): Promise<Vocabulary> {
	if (cached) return cached;
	const [workflows, groups, self, customFields] = await Promise.all([
		fetchWorkflows(token),
		fetchGroups(token),
		fetchSelf(token),
		fetchCustomFields(token),
	]);
	const stateIdByName = new Map<string, number>();
	const stateNameById = new Map<number, string>();
	for (const wf of workflows) {
		for (const s of wf.states) {
			stateIdByName.set(s.name.toLowerCase(), s.id);
			stateNameById.set(s.id, s.name);
		}
	}
	cached = {
		workflows,
		groups,
		self,
		customFields,
		stateIdByName,
		stateNameById,
	};
	return cached;
}

export function resolveStateId(vocab: Vocabulary, name: string): number {
	const id = vocab.stateIdByName.get(name.toLowerCase());
	if (id === undefined) {
		const valid = Array.from(vocab.stateIdByName.keys()).join(", ");
		throw new Error(`unknown state "${name}"; valid: ${valid}`);
	}
	return id;
}

export function resolvePriorityValueId(
	vocab: Vocabulary,
	priority: string,
): { field_id: string; value_id: string } {
	const field = vocab.customFields.find(
		(f) => f.canonical_name.toLowerCase() === "priority",
	);
	if (!field) throw new Error("no Priority custom field in this workspace");
	const value = field.values.find(
		(v) => v.value.toLowerCase() === priority.toLowerCase(),
	);
	if (!value) {
		const valid = field.values.map((v) => v.value).join(", ");
		throw new Error(`unknown priority "${priority}"; valid: ${valid}`);
	}
	return { field_id: field.id, value_id: value.id };
}
