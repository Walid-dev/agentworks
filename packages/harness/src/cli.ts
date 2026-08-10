import { Command } from "commander";
import { loadTasksDir } from "./tasks.js";

const program = new Command();
program.name("harness").description("AgentWorks harness CLI");

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

program.parse(process.argv);
