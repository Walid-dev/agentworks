import { describe, expect, it } from "vitest";
import { overallStatus } from "./storage.js";

// 1.8 gate ruling B: grade_status and teardown_status are separate;
// the derived "overall" status must not eclipse a completed grade
// when teardown fails. These tests pin the semantics.

describe("overallStatus (bookkeeping split)", () => {
	it("pass + ok → pass", () => {
		expect(overallStatus("pass", "ok")).toBe("pass");
	});

	it("pass + error → teardown-error (grade still visible)", () => {
		expect(overallStatus("pass", "error")).toBe("teardown-error");
	});

	it("fail + ok → fail (teardown ok doesn't rescue a bad grade)", () => {
		expect(overallStatus("fail", "ok")).toBe("fail");
	});

	it("fail + error → fail (grade result takes precedence over teardown noise)", () => {
		expect(overallStatus("fail", "error")).toBe("fail");
	});

	it("ungraded stays ungraded regardless of teardown", () => {
		expect(overallStatus("ungraded", "ok")).toBe("ungraded");
		expect(overallStatus("ungraded", "error")).toBe("ungraded");
	});

	it("refused stays refused; teardown is skipped in that state", () => {
		expect(overallStatus("refused", "skipped")).toBe("refused");
	});

	it("dry-run-ok requires clean teardown; teardown_error demotes to dry-run-fail", () => {
		expect(overallStatus("dry-run-ok", "ok")).toBe("dry-run-ok");
		expect(overallStatus("dry-run-ok", "error")).toBe("dry-run-fail");
	});

	it("dry-run-fail stays dry-run-fail", () => {
		expect(overallStatus("dry-run-fail", "ok")).toBe("dry-run-fail");
	});
});
