import { Command } from "commander";
import { runAttempt } from "./attempt.js";
import { loadLanes } from "./lanes.js";
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
	.action(
		async (opts: {
			task: string;
			lane: string;
			driver: string;
			tasksDir: string;
			lanesFile: string;
			runsDir: string;
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
			});
			if (result.status === "refused") {
				console.error(`\nREFUSED\n${result.reason}`);
				console.error(`\ntranscript: ${result.transcriptPath}`);
				process.exit(1);
			}
			console.log(`\nattempt ${result.status}: ${result.transcriptPath}`);
		},
	);

program.parse(process.argv);
