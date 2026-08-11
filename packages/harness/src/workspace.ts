// Workspace adapter for the graders. Wraps the Shortcut REST client
// behind a narrow interface so tests can inject a fake and exercise
// the id-first / name-fallback / retry paths without touching a live
// workspace.

import {
	fetchStoryFull,
	type LiveStory,
	type LiveStoryFull,
	searchByName,
	searchByState,
} from "./shortcut.js";

export interface Workspace {
	searchByName(title: string): Promise<LiveStory[]>;
	searchByState(stateName: string): Promise<LiveStory[]>;
	fetchStory(id: number): Promise<LiveStoryFull | null>;
}

export function createLiveWorkspace(token: string): Workspace {
	return {
		async searchByName(title: string): Promise<LiveStory[]> {
			return searchByName(token, title);
		},
		async searchByState(stateName: string): Promise<LiveStory[]> {
			return searchByState(token, stateName);
		},
		async fetchStory(id: number): Promise<LiveStoryFull | null> {
			return fetchStoryFull(token, id);
		},
	};
}
