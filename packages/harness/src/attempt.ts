import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { checkBaseline, snapshotIdSet } from "./baseline.js";
import { type GradeRecord, grade } from "./graders.js";
import type { Lane } from "./lanes.js";
import { createLogger } from "./logger.js";
import { bareLoopRuntime } from "./runtime.js";
import { runSetup, substituteRun } from "./setup.js";
import type { GoldenTask } from "./tasks.js";
import { runTeardown } from "./teardown.js";

export type AttemptOpts = {
	task: GoldenTask;
	lane: Lane;
	driverId: string;
	runsBaseDir: string;
	sweepId?: string;
};

export type AttemptResult = {
	transcriptPath: string;
	runStamp: string;
	status: "pass" | "fail" | "ungraded" | "refused";
	reason?: string;
	grade?: GradeRecord;
};

function makeRunStamp(): string {
	return new Date().toISOString().replace(/[:.]/g, "-");
}

export async function runAttempt(opts: AttemptOpts): Promise<AttemptResult> {
	const runStamp = makeRunStamp();
	const sweep = opts.sweepId ?? runStamp;
	const transcriptPath = join(
		opts.runsBaseDir,
		sweep,
		opts.task.id,
		opts.lane.id,
		`${runStamp}.jsonl`,
	);

	const token = process.env.SHORTCUT_API_TOKEN;
	if (!token) throw new Error("SHORTCUT_API_TOKEN is not set");
	if (!process.env.ANTHROPIC_API_KEY)
		throw new Error("ANTHROPIC_API_KEY is not set");

	const { log, events } = createLogger(transcriptPath, [token]);

	log({
		type: "meta.start",
		task_id: opts.task.id,
		lane_id: opts.lane.id,
		driver_id: opts.driverId,
		run_stamp: runStamp,
		sweep_id: sweep,
		started_at: new Date().toISOString(),
	});

	// Baseline check. Refuse loudly on a dirty course.
	const baselineBefore = await checkBaseline(token);
	log({
		type: "baseline.before",
		ok: baselineBefore.ok,
		live_count: baselineBefore.live_count,
		issues: baselineBefore.issues,
	});
	if (!baselineBefore.ok) {
		log({
			type: "meta.end",
			status: "refused",
			reason: "dirty course",
			ended_at: new Date().toISOString(),
		});
		const reason = `refusing to run on dirty course:\n  - ${baselineBefore.issues.join("\n  - ")}`;
		return {
			transcriptPath,
			runStamp,
			status: "refused",
			reason,
		};
	}

	// Snapshot pre-attempt id set so teardown can detect strays created
	// during the attempt (not just setup fixtures).
	const preIds = await snapshotIdSet(token);

	// Setup (creates fixtures if the task has any).
	const fixtures = await runSetup(opts.task, runStamp, token);
	log({ type: "setup", fixtures, at: new Date().toISOString() });

	// Spawn the lane's MCP server fresh, connect, run, close.
	const transport = new StdioClientTransport({
		command: opts.lane.command,
		args: opts.lane.args,
		env: opts.lane.env
			? ({ ...process.env, ...opts.lane.env } as Record<string, string>)
			: undefined,
	});
	const mcp = new Client({
		name: "agentworks-harness",
		version: "0.0.0",
	});
	await mcp.connect(transport);

	let runtimeResult: Awaited<ReturnType<typeof bareLoopRuntime.run>>;
	try {
		runtimeResult = await bareLoopRuntime.run({
			task: opts.task,
			userPrompt: substituteRun(opts.task.prompt, runStamp),
			mcp,
			driverId: opts.driverId,
			log,
		});
	} finally {
		await mcp.close();
	}

	log({
		type: "final_answer",
		text: runtimeResult.final_message,
		turns: runtimeResult.turns,
		stop_reason: runtimeResult.stop_reason,
		input_tokens: runtimeResult.input_tokens,
		output_tokens: runtimeResult.output_tokens,
		at: new Date().toISOString(),
	});

	// Grade BEFORE teardown so the workspace still holds whatever the
	// agent did (per docs/specs/graders.md). Snapshot the post-attempt
	// id set for workspace_unchanged.
	const postIds = await snapshotIdSet(token);
	const gradeRecord = await grade({
		task: opts.task,
		events: events as Array<Record<string, unknown> & { type: string }>,
		fixtures,
		preIds,
		postIds,
		runStamp,
		laneId: opts.lane.id,
		token,
	});
	log(gradeRecord);

	// Teardown: capture-before-destroy, then baseline re-verify.
	const teardown = await runTeardown(fixtures, preIds, token);
	log({ type: "teardown", ...teardown, at: new Date().toISOString() });

	log({
		type: "meta.end",
		status: gradeRecord.status,
		ended_at: new Date().toISOString(),
	});

	return {
		transcriptPath,
		runStamp,
		status: gradeRecord.status,
		grade: gradeRecord,
	};
}
