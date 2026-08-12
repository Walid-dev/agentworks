import {
	appendFileSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	statSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { Command } from "commander";
import { runAttempt } from "./attempt.js";
import type { GradeRecord } from "./graders.js";
import { loadLanes } from "./lanes.js";
import { insertAttempt, openBench, rowFromGrade } from "./storage.js";
import { loadTasksDir } from "./tasks.js";

const program = new Command();
program
	.name("bench")
	.description("AgentWorks benchmark harness — attempts, tasks, sweeps");

// bench tasks validate [dir]
const tasksCmd = program.command("tasks").description("Golden task operations");

tasksCmd
	.command("validate [dir]")
	.description(
		"Validate golden task YAML files in a directory (default: ./tasks)",
	)
	.action((dir: string | undefined) => {
		const target = dir ?? "tasks";
		const results = loadTasksDir(target);
		let pass = 0;
		let fail = 0;
		for (const r of results) {
			if (r.ok) {
				console.log(`ok    ${r.file}  id=${r.task.id}  class=${r.task.class}`);
				pass++;
			} else {
				for (const e of r.errors) console.log(`FAIL  ${r.file}  ${e}`);
				fail++;
			}
		}
		console.log(`\n${pass} passed, ${fail} failed`);
		if (fail > 0) process.exit(1);
	});

// bench attempt --task <id> --lane <id> --driver <model-id>
program
	.command("attempt")
	.description("Run one golden task against one lane once")
	.requiredOption("--task <id>", "task id (as declared in the YAML)")
	.requiredOption("--lane <id>", "lane id (from lanes.json)")
	.requiredOption(
		"--driver <model-id>",
		"driver model id (recorded in the transcript)",
	)
	.option("--tasks-dir <path>", "tasks directory", "tasks")
	.option(
		"--lanes-file <path>",
		"lanes config path",
		"packages/harness/lanes.json",
	)
	.option("--runs-dir <path>", "runs base directory", "runs")
	.option(
		"--dry-run",
		"run the full lifecycle with zero model calls (preflight)",
		false,
	)
	.action(
		async (opts: {
			task: string;
			lane: string;
			driver: string;
			tasksDir: string;
			lanesFile: string;
			runsDir: string;
			dryRun: boolean;
		}) => {
			const loaded = loadTasksDir(opts.tasksDir);
			const found = loaded.find((r) => r.ok && r.task.id === opts.task);
			if (!found?.ok) {
				console.error(`task not found: ${opts.task}`);
				process.exit(1);
			}
			const lanes = loadLanes(opts.lanesFile);
			const lane = lanes[opts.lane];
			if (!lane) {
				console.error(
					`lane not found: ${opts.lane} (available: ${Object.keys(lanes).join(", ")})`,
				);
				process.exit(1);
			}
			const result = await runAttempt({
				task: found.task,
				lane,
				driverId: opts.driver,
				runsBaseDir: opts.runsDir,
				dryRun: opts.dryRun,
			});
			if (result.grade_status === "refused") {
				console.error(`\nREFUSED\n${result.reason}`);
				console.error(`\ntranscript: ${result.transcriptPath}`);
				process.exit(1);
			}
			if (result.grade_status === "dry-run-fail") {
				console.error(`\nDRY-RUN FAIL\n${result.reason}`);
				console.error(`\ntranscript: ${result.transcriptPath}`);
				process.exit(1);
			}
			const suffix =
				result.teardown_status === "error"
					? ` (teardown_error: ${result.teardown_error ?? "?"})`
					: "";
			console.log(
				`\nattempt ${result.grade_status}${suffix}: ${result.transcriptPath}`,
			);
		},
	);

// bench sweep --tasks <ids>... --lanes <ids>... --reps <N> --driver <model-id>
program
	.command("sweep")
	.description(
		"Run tasks x lanes x reps against one driver, writing bench.sqlite and a teardown log",
	)
	.requiredOption(
		"--tasks <ids>",
		"comma-separated task ids (or 'all' for the whole tasks dir)",
	)
	.requiredOption("--lanes <ids>", "comma-separated lane ids")
	.requiredOption("--reps <n>", "repetitions per (task, lane)", (v) =>
		Number.parseInt(v, 10),
	)
	.requiredOption("--driver <model-id>", "driver model id")
	.option("--tasks-dir <path>", "tasks directory", "tasks")
	.option(
		"--lanes-file <path>",
		"lanes config path",
		"packages/harness/lanes.json",
	)
	.option("--runs-dir <path>", "runs base directory", "runs")
	.option(
		"--dry-run",
		"run every attempt as a preflight (no model calls)",
		false,
	)
	.action(
		async (opts: {
			tasks: string;
			lanes: string;
			reps: number;
			driver: string;
			tasksDir: string;
			lanesFile: string;
			runsDir: string;
			dryRun: boolean;
		}) => {
			const allTasks = loadTasksDir(opts.tasksDir);
			for (const r of allTasks) {
				if (!r.ok) {
					console.error(`FAIL ${r.file}: ${r.errors.join("; ")}`);
					process.exit(1);
				}
			}
			const okTasks = allTasks.flatMap((r) => (r.ok ? [r.task] : []));
			const taskIds =
				opts.tasks === "all" ? okTasks.map((t) => t.id) : opts.tasks.split(",");
			const tasks = taskIds.map((id) => {
				const t = okTasks.find((x) => x.id === id);
				if (!t) {
					console.error(`task not found: ${id}`);
					process.exit(1);
				}
				return t;
			});
			const lanesMap = loadLanes(opts.lanesFile);
			const laneIds = opts.lanes.split(",");
			const lanes = laneIds.map((id) => {
				const l = lanesMap[id];
				if (!l) {
					console.error(
						`lane not found: ${id} (available: ${Object.keys(lanesMap).join(", ")})`,
					);
					process.exit(1);
				}
				return l;
			});

			const sweepId = new Date().toISOString().replace(/[:.]/g, "-");
			const dbPath = join(opts.runsDir, "bench.sqlite");
			const db = openBench(dbPath);

			const teardownLogPath = join(opts.runsDir, sweepId, "teardown-log.jsonl");
			mkdirSync(dirname(teardownLogPath), { recursive: true });
			const teardownLog = (event: unknown) => {
				appendFileSync(teardownLogPath, `${JSON.stringify(event)}\n`);
			};

			let passed = 0;
			let failed = 0;
			let ungraded = 0;
			let refused = 0;
			let dryOk = 0;
			let dryFail = 0;
			const total = tasks.length * lanes.length * opts.reps;
			let idx = 0;

			teardownLog({
				type: "sweep.start",
				sweep_id: sweepId,
				tasks: tasks.map((t) => t.id),
				lanes: lanes.map((l) => l.id),
				reps: opts.reps,
				driver: opts.driver,
				at: new Date().toISOString(),
			});

			for (let rep = 0; rep < opts.reps; rep++) {
				for (const task of tasks) {
					for (const lane of lanes) {
						idx++;
						const label = `[${idx}/${total}] rep=${rep + 1} task=${task.id} lane=${lane.id}`;
						process.stdout.write(`${label} ... `);
						try {
							const result = await runAttempt({
								task,
								lane,
								driverId: opts.driver,
								runsBaseDir: opts.runsDir,
								sweepId,
								dryRun: opts.dryRun,
							});
							const display =
								result.teardown_status === "error"
									? `${result.grade_status} (teardown_error)`
									: result.grade_status;
							console.log(display);
							insertAttempt(
								db,
								rowFromGrade({
									runStamp: result.runStamp,
									sweepId,
									taskId: task.id,
									laneId: lane.id,
									driverId: opts.driver,
									transcriptPath: result.transcriptPath,
									grade_status: result.grade_status,
									teardown_status: result.teardown_status,
									teardown_error: result.teardown_error,
									reason: result.reason ?? null,
									grade: result.grade ?? null,
								}),
							);
							teardownLog({
								type: "attempt.done",
								run_stamp: result.runStamp,
								task_id: task.id,
								lane_id: lane.id,
								grade_status: result.grade_status,
								teardown_status: result.teardown_status,
								teardown_error: result.teardown_error ?? null,
								transcript: result.transcriptPath,
								at: new Date().toISOString(),
							});
							if (result.grade_status === "pass") passed++;
							else if (result.grade_status === "fail") failed++;
							else if (result.grade_status === "ungraded") ungraded++;
							else if (result.grade_status === "refused") refused++;
							else if (result.grade_status === "dry-run-ok") dryOk++;
							else if (result.grade_status === "dry-run-fail") dryFail++;
						} catch (e) {
							const msg = (e as Error).message;
							console.log(`error: ${msg}`);
							teardownLog({
								type: "attempt.error",
								task_id: task.id,
								lane_id: lane.id,
								error: msg,
								at: new Date().toISOString(),
							});
							// Record an ungraded row so bench.sqlite reflects every
							// attempted (task, lane, rep) even when the runtime errored
							// before producing a grade record.
							insertAttempt(
								db,
								rowFromGrade({
									runStamp: `error-${sweepId}-${idx}`,
									sweepId,
									taskId: task.id,
									laneId: lane.id,
									driverId: opts.driver,
									transcriptPath: "",
									grade_status: "ungraded",
									teardown_status: "skipped",
									reason: msg,
									grade: null,
								}),
							);
							ungraded++;
						}
					}
				}
			}

			teardownLog({
				type: "sweep.end",
				sweep_id: sweepId,
				dry_run: opts.dryRun,
				passed,
				failed,
				ungraded,
				refused,
				dry_ok: dryOk,
				dry_fail: dryFail,
				at: new Date().toISOString(),
			});

			db.close();

			if (opts.dryRun) {
				console.log(
					`\ndry-run sweep ${sweepId}: dry-ok=${dryOk} dry-fail=${dryFail} refused=${refused}`,
				);
			} else {
				console.log(
					`\nsweep ${sweepId}: passed=${passed} failed=${failed} ungraded=${ungraded} refused=${refused}`,
				);
			}
			console.log(`bench.sqlite: ${dbPath}`);
			console.log(`teardown log: ${teardownLogPath}`);

			if (passed + failed + ungraded + refused + dryOk + dryFail === 0)
				process.exit(1);
			// Sweep dry-run exits nonzero if any attempt failed preflight —
			// makes CI-style gates trivial.
			if (opts.dryRun && dryFail > 0) process.exit(1);
		},
	);

// bench sqlite rebuild <sweep-dir>
// Rebuilds runs/bench.sqlite from a sweep's JSONL transcripts. The
// sqlite file is derived and disposable per docs/specs/harness.md;
// the JSONLs are the truth. Every transcript in
// <sweep-dir>/<task>/<lane>/*.jsonl is read; its meta.start supplies
// the identity fields, its grade record supplies pass/fail and
// measurements. Transcripts with no grade land as ungraded rows.
const sqliteCmd = program
	.command("sqlite")
	.description("bench.sqlite operations");

sqliteCmd
	.command("rebuild <sweep-dir>")
	.description("Rebuild bench.sqlite from a sweep's JSONL transcripts")
	.option("--out <path>", "output sqlite path", "runs/bench.sqlite")
	.action((sweepDir: string, opts: { out: string }) => {
		if (!statSync(sweepDir).isDirectory()) {
			console.error(`not a directory: ${sweepDir}`);
			process.exit(1);
		}
		const db = openBench(opts.out);
		let inserted = 0;
		for (const taskId of readdirSync(sweepDir)) {
			const taskDir = join(sweepDir, taskId);
			if (!statSync(taskDir).isDirectory()) continue;
			for (const laneId of readdirSync(taskDir)) {
				const laneDir = join(taskDir, laneId);
				if (!statSync(laneDir).isDirectory()) continue;
				for (const file of readdirSync(laneDir)) {
					if (!file.endsWith(".jsonl")) continue;
					const transcriptPath = join(laneDir, file);
					const events = readFileSync(transcriptPath, "utf8")
						.split("\n")
						.filter((l) => l.length > 0)
						.map((l) => JSON.parse(l) as Record<string, unknown>);
					const meta = events.find((e) => e.type === "meta.start") as
						| {
								run_stamp?: string;
								sweep_id?: string;
								task_id?: string;
								lane_id?: string;
								driver_id?: string;
						  }
						| undefined;
					const gradeEv = events.find((e) => e.type === "grade") as
						| GradeRecord
						| undefined;
					const metaEnd = events.find((e) => e.type === "meta.end") as
						| {
								status?: string;
								grade_status?: string;
								teardown_status?: string;
								teardown_error?: string;
								reason?: string;
						  }
						| undefined;
					const teardownEv = events.find((e) => e.type === "teardown") as
						| { baseline_reverify?: { ok?: boolean } }
						| undefined;
					const teardownError = events.find(
						(e) => e.type === "teardown.error",
					) as { error?: string } | undefined;
					if (!meta?.run_stamp) continue;

					// Bookkeeping split (1.8): grade_status and
					// teardown_status are independent. Prefer the new
					// meta.end fields; fall back to the old single `status`
					// field for pre-1.8 transcripts (grade_status only) and
					// infer teardown_status from the presence and shape of
					// the teardown event.
					const gradeStatus =
						metaEnd?.grade_status ??
						metaEnd?.status ??
						gradeEv?.status ??
						"ungraded";
					const teardownStatus =
						metaEnd?.teardown_status ??
						(teardownError
							? "error"
							: teardownEv
								? teardownEv.baseline_reverify?.ok === true
									? "ok"
									: "error"
								: gradeStatus === "refused"
									? "skipped"
									: "error");
					const teardownErrMsg =
						metaEnd?.teardown_error ?? teardownError?.error ?? null;

					insertAttempt(
						db,
						rowFromGrade({
							runStamp: meta.run_stamp,
							sweepId: meta.sweep_id ?? "unknown",
							taskId: meta.task_id ?? taskId,
							laneId: meta.lane_id ?? laneId,
							driverId: meta.driver_id ?? "unknown",
							transcriptPath,
							grade_status: gradeStatus,
							teardown_status: teardownStatus,
							teardown_error: teardownErrMsg,
							reason: metaEnd?.reason ?? null,
							grade: gradeEv ?? null,
						}),
					);
					inserted++;
				}
			}
		}
		db.close();
		console.log(`rebuilt ${opts.out} from ${sweepDir}: ${inserted} attempts`);
	});

program.parse(process.argv);
