import { appendFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

// Streaming JSONL writer. Every record is serialized and checked for
// forbidden substrings (secrets) BEFORE writing, so a leak fails the
// attempt loudly instead of leaving a poisoned transcript on disk.

export type Logger = (event: unknown) => void;

export function createLogger(path: string, forbidden: string[]): Logger {
	mkdirSync(dirname(path), { recursive: true });
	const nonEmpty = forbidden.filter((s) => s.length > 0);
	return (event: unknown) => {
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
	};
}
