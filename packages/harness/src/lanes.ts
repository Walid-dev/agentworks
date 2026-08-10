import { readFileSync } from "node:fs";
import { z } from "zod";

// Lane config schema. Lanes are token-bearing, per-machine, and
// therefore live in a gitignored `lanes.json` next to a committed
// `lanes.example.json` (same security posture as mcp-exam-*.json).

const LaneConfig = z
	.object({
		id: z.string(),
		command: z.string(),
		args: z.array(z.string()),
		env: z.record(z.string(), z.string()).optional(),
	})
	.strict();

const LanesFile = z
	.object({
		lanes: z.record(z.string(), LaneConfig),
	})
	.strict();

export type Lane = z.infer<typeof LaneConfig>;

export function loadLanes(path: string): Record<string, Lane> {
	const raw = readFileSync(path, "utf8");
	const parsed = JSON.parse(raw);
	const result = LanesFile.parse(parsed);
	return result.lanes;
}
