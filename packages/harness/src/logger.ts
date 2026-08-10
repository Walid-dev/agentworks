import { appendFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

// Streaming JSONL writer. Every record is serialized and checked for
// forbidden substrings (secrets) BEFORE writing, so a leak fails the
// attempt loudly instead of leaving a poisoned transcript on disk.
// Events are also collected in memory so the grader can read them
// without reparsing the file it just wrote.

export type Logger = (event: unknown) => void;

export type LoggerHandle = {
	log: Logger;
	events: Record<string, unknown>[];
};

export function createLogger(path: string, forbidden: string[]): LoggerHandle {
	mkdirSync(dirname(path), { recursive: true });
	const nonEmpty = forbidden.filter((s) => s.length > 0);
	const events: Record<string, unknown>[] = [];
	const log: Logger = (event: unknown) => {
		const line = JSON.stringify(event);
		for (const secret of nonEmpty) {
			if (line.includes(secret)) {
				throw new Error(
					`transcript would leak a secret; refusing to write (event.type=${
						(event as { type?: string }).type ?? "?"
					})`,
				);
			}
		}
		appendFileSync(path, `${line}\n`);
		events.push(event as Record<string, unknown>);
	};
	return { log, events };
}
