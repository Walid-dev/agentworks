import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";
import type { GradeRecord } from "./graders.js";

// Derived storage for per-attempt results. The JSONL transcripts under
// runs/ are the truth; this SQLite file is rebuildable from them at
// any time. Kept small on purpose: one row per attempt, plus a
// full-grade-record JSON column for detail queries.
//
// 1.8 gate ruling: grade_status and teardown_status are separate.
// A teardown failure never overwrites a completed grade. The legacy
// `status` column is derived (pass only when both are clean) for
// backwards compatibility with existing aggregate queries.

export type AttemptRow = {
	run_stamp: string;
	sweep_id: string;
	task_id: string;
	lane_id: string;
	driver_id: string;
	status: string;
	grade_status: string;
	teardown_status: string;
	teardown_error: string | null;
	reason: string | null;
	transcript_path: string;
	turns: number | null;
	tool_calls_total: number | null;
	invalid_tool_calls: number | null;
	input_tokens: number | null;
	output_tokens: number | null;
	wall_ms: number | null;
	expected_tools_only: number | null;
	stop_reason: string | null;
	grade_json: string | null;
};

export function openBench(path: string): Database.Database {
	mkdirSync(dirname(path), { recursive: true });
	const db = new Database(path);
	db.pragma("journal_mode = WAL");
	db.exec(`
		CREATE TABLE IF NOT EXISTS attempts (
			run_stamp TEXT PRIMARY KEY,
			sweep_id TEXT NOT NULL,
			task_id TEXT NOT NULL,
			lane_id TEXT NOT NULL,
			driver_id TEXT NOT NULL,
			status TEXT NOT NULL,
			grade_status TEXT NOT NULL,
			teardown_status TEXT NOT NULL,
			teardown_error TEXT,
			reason TEXT,
			transcript_path TEXT NOT NULL,
			turns INTEGER,
			tool_calls_total INTEGER,
			invalid_tool_calls INTEGER,
			input_tokens INTEGER,
			output_tokens INTEGER,
			wall_ms INTEGER,
			expected_tools_only INTEGER,
			stop_reason TEXT,
			grade_json TEXT
		);
		CREATE INDEX IF NOT EXISTS attempts_by_task_lane
			ON attempts(task_id, lane_id);
		CREATE INDEX IF NOT EXISTS attempts_by_sweep
			ON attempts(sweep_id);
	`);
	return db;
}

export function insertAttempt(db: Database.Database, row: AttemptRow): void {
	db.prepare(
		`INSERT OR REPLACE INTO attempts (
			run_stamp, sweep_id, task_id, lane_id, driver_id, status,
			grade_status, teardown_status, teardown_error, reason,
			transcript_path, turns, tool_calls_total, invalid_tool_calls,
			input_tokens, output_tokens, wall_ms, expected_tools_only,
			stop_reason, grade_json
		) VALUES (
			@run_stamp, @sweep_id, @task_id, @lane_id, @driver_id, @status,
			@grade_status, @teardown_status, @teardown_error, @reason,
			@transcript_path, @turns, @tool_calls_total, @invalid_tool_calls,
			@input_tokens, @output_tokens, @wall_ms, @expected_tools_only,
			@stop_reason, @grade_json
		)`,
	).run(row);
}

// Derived "overall" status. pass only when both grade and teardown are
// clean; otherwise report whichever side failed first (grade takes
// precedence: a failed grade is the primary outcome, teardown issues
// are diagnostic).
export function overallStatus(
	grade_status: string,
	teardown_status: string,
): string {
	if (grade_status === "refused") return "refused";
	if (grade_status === "ungraded") return "ungraded";
	if (grade_status === "fail") return "fail";
	if (grade_status === "dry-run-fail") return "dry-run-fail";
	if (grade_status === "dry-run-ok") {
		return teardown_status === "ok" ? "dry-run-ok" : "dry-run-fail";
	}
	// grade_status === "pass"
	return teardown_status === "ok" ? "pass" : "teardown-error";
}

export function rowFromGrade(args: {
	runStamp: string;
	sweepId: string;
	taskId: string;
	laneId: string;
	driverId: string;
	transcriptPath: string;
	grade_status: string;
	teardown_status: string;
	teardown_error?: string | null;
	reason: string | null;
	grade: GradeRecord | null;
}): AttemptRow {
	const g = args.grade;
	return {
		run_stamp: args.runStamp,
		sweep_id: args.sweepId,
		task_id: args.taskId,
		lane_id: args.laneId,
		driver_id: args.driverId,
		status: overallStatus(args.grade_status, args.teardown_status),
		grade_status: args.grade_status,
		teardown_status: args.teardown_status,
		teardown_error: args.teardown_error ?? null,
		reason: args.reason,
		transcript_path: args.transcriptPath,
		turns: g?.measurements.turns ?? null,
		tool_calls_total: g?.measurements.tool_calls_total ?? null,
		invalid_tool_calls: g?.measurements.invalid_tool_calls ?? null,
		input_tokens: g?.measurements.input_tokens ?? null,
		output_tokens: g?.measurements.output_tokens ?? null,
		wall_ms: g?.measurements.wall_ms ?? null,
		expected_tools_only:
			g?.measurements.expected_tools_only === null
				? null
				: g?.measurements.expected_tools_only
					? 1
					: 0,
		stop_reason: g?.measurements.stop_reason ?? null,
		grade_json: g ? JSON.stringify(g) : null,
	};
}
