import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { checkBaseline, snapshotIdSet } from "./baseline.js";
import { type GradeRecord, grade } from "./graders.js";
import type { Lane } from "./lanes.js";
import { createLogger } from "./logger.js";
import { selectRuntime } from "./openai-runtime.js";
import { assertNoPlaceholder, runSetup, substituteRun } from "./setup.js";
import type { GoldenTask } from "./tasks.js";
import { runTeardown } from "./teardown.js";

export type AttemptOpts = {
	task: GoldenTask;
	lane: Lane;
	driverId: string;
	runsBaseDir: string;
	sweepId?: string;
	dryRun?: boolean;
};

// Honest bookkeeping (1.8 gate ruling): the grader and teardown record
// independently. A teardown failure never overwrites a completed grade.
// meta.end always names both, whether the run finished cleanly or not.
export type GradeStatus =
	| "pass"
	| "fail"
	| "ungraded"
	| "refused"
	| "dry-run-ok"
	| "dry-run-fail";

export type TeardownStatus = "ok" | "error" | "skipped";

export type AttemptResult = {
	transcriptPath: string;
	runStamp: string;
	grade_status: GradeStatus;
	teardown_status: TeardownStatus;
	teardown_error?: string;
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
	// Dry-run makes zero model calls; the driver's env key is only
	// required when the runtime will actually be invoked. selectRuntime
	// also validates the driver-id family up front so a typo fails
	// before setup creates fixtures.
	const { runtime, requiredEnv } = selectRuntime(opts.driverId);
	if (!opts.dryRun && !process.env[requiredEnv])
		throw new Error(`${requiredEnv} is not set`);

	const { log, events } = createLogger(transcriptPath, [token]);

	log({
		type: "meta.start",
		task_id: opts.task.id,
		lane_id: opts.lane.id,
		driver_id: opts.driverId,
		run_stamp: runStamp,
		sweep_id: sweep,
		dry_run: opts.dryRun === true,
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
			grade_status: "refused",
			teardown_status: "skipped",
			reason: "dirty course",
			ended_at: new Date().toISOString(),
		});
		const reason = `refusing to run on dirty course:\n  - ${baselineBefore.issues.join("\n  - ")}`;
		return {
			transcriptPath,
			runStamp,
			grade_status: "refused",
			teardown_status: "skipped",
			reason,
		};
	}

	// Snapshot pre-attempt id set so teardown can detect strays created
	// during the attempt (not just setup fixtures).
	const preIds = await snapshotIdSet(token);

	// Setup (creates fixtures if the task has any). setup.ts asserts
	// no placeholder remains in each fixture title.
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

	if (opts.dryRun) {
		// Full attempt lifecycle without any model call. Exercise every
		// seam that a paid attempt would exercise except messages.create.
		const dryFindings: string[] = [];
		try {
			const substitutedPrompt = substituteRun(opts.task.prompt, runStamp);
			try {
				assertNoPlaceholder(substitutedPrompt, "task prompt");
			} catch (e) {
				dryFindings.push((e as Error).message);
			}
			for (const fx of fixtures) {
				try {
					assertNoPlaceholder(fx.title, `fixture "${fx.ref ?? "?"}"`);
				} catch (e) {
					dryFindings.push((e as Error).message);
				}
			}
			const listed = await mcp.listTools();
			log({
				type: "tools_available",
				count: listed.tools.length,
				names: listed.tools.map((t) => t.name),
				at: new Date().toISOString(),
			});
			if (listed.tools.length === 0) {
				dryFindings.push(
					`lane ${opts.lane.id} exposed zero tools via tools/list`,
				);
			}
		} finally {
			await mcp.close();
		}

		const dryTd = await runTeardownSafely(fixtures, preIds, token, log);
		if (dryTd.status === "error") {
			dryFindings.push(`teardown crashed: ${dryTd.error}`);
		} else if (dryTd.record && !dryTd.record.baseline_reverify.ok) {
			dryFindings.push(
				`teardown left residue: ${dryTd.record.baseline_reverify.issues.join("; ")}`,
			);
		}

		const ok = dryFindings.length === 0;
		log({
			type: "dry_run.summary",
			ok,
			findings: dryFindings,
			at: new Date().toISOString(),
		});
		const gradeStatus: GradeStatus = ok ? "dry-run-ok" : "dry-run-fail";
		log({
			type: "meta.end",
			grade_status: gradeStatus,
			teardown_status: dryTd.status,
			ended_at: new Date().toISOString(),
		});
		return {
			transcriptPath,
			runStamp,
			grade_status: gradeStatus,
			teardown_status: dryTd.status,
			teardown_error: dryTd.error,
			reason: ok ? undefined : dryFindings.join("; "),
		};
	}

	let runtimeResult: Awaited<ReturnType<typeof runtime.run>>;
	try {
		runtimeResult = await runtime.run({
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
		cache_creation_input_tokens: runtimeResult.cache_creation_input_tokens,
		cache_read_input_tokens: runtimeResult.cache_read_input_tokens,
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

	// Teardown: capture-before-destroy, then baseline re-verify. A
	// crash here never overwrites the grade — the transcript records
	// both statuses independently.
	const td = await runTeardownSafely(fixtures, preIds, token, log);

	log({
		type: "meta.end",
		grade_status: gradeRecord.status,
		teardown_status: td.status,
		teardown_error: td.error,
		ended_at: new Date().toISOString(),
	});

	return {
		transcriptPath,
		runStamp,
		grade_status: gradeRecord.status,
		teardown_status: td.status,
		teardown_error: td.error,
		grade: gradeRecord,
	};
}

// Wraps teardown in a try/catch so a Shortcut 5xx / network error at
// this stage never eclipses the grade. If teardown throws before it
// can write its own record, we synthesize a teardown.error event so
// the transcript still tells the story.
async function runTeardownSafely(
	fixtures: Awaited<ReturnType<typeof runSetup>>,
	preIds: Set<number>,
	token: string,
	log: (event: unknown) => void,
): Promise<{
	status: TeardownStatus;
	error?: string;
	record?: Awaited<ReturnType<typeof runTeardown>>;
}> {
	try {
		const record = await runTeardown(fixtures, preIds, token);
		log({ type: "teardown", ...record, at: new Date().toISOString() });
		if (!record.baseline_reverify.ok) {
			return { status: "error", record, error: "baseline re-verify failed" };
		}
		return { status: "ok", record };
	} catch (e) {
		const msg = (e as Error).message;
		log({ type: "teardown.error", error: msg, at: new Date().toISOString() });
		return { status: "error", error: msg };
	}
}
