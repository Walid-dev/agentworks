# Spec: the graders (packages/harness, grading)

Intent: turn one finished attempt into pass/fail plus measurements,
deterministically, by checking reality rather than believing the agent.
The graders are the part of the Examiner every number rests on; if they
are wrong, everything downstream is decoration. They apply the one rule
the whole project runs on: never take the driver's word for anything.

## What it does

Grading runs after an attempt completes and before its teardown, so the
workspace still holds whatever the agent did. Inputs: the attempt's
transcript (JSONL), the task definition, the fixture map (ref -> live
id, recorded at setup), and the live Shortcut workspace. Output: one
grade record per attempt.

**The checks, one by one.** Each check from the task's `grade` list runs
independently; the attempt passes only if every check passes.

- `story_exists` — search the live workspace for a story whose title
  matches (tolerances applied). Exactly one match required: zero fails,
  two or more fails (ambiguity is failure, not luck). Then each field
  assertion runs against that story: `state_name` compares against the
  workflow state's name fetched live, never against type;
  `owner_is_self` resolves "self" through the API token's member id;
  `deadline_within` passes if the stored instant falls anywhere inside
  the named calendar day in the named timezone; `tasks` compares the
  checklist as a set with casing tolerance; `description_contains` is a
  substring check after casing tolerance.
- `story_absent` — the same search must find zero matches.
- `comment_on` — resolve the story (fixture ref or numeric id), fetch
  its comments live, filter out soft-deleted ones (`deleted: true` —
  the Phase 0 cleanup finding, now law), and require at least one
  surviving comment whose text contains the expected string after
  tolerance.
- `answer_ids` — extract story ids from the final assistant message
  only (not from tool results, not from thinking), as the set of
  numbers matching Shortcut id patterns; compare as a set:
  - `equals_state`: the expected set is fetched live at grading time —
    every story currently in the state with that exact name.
  - `equals_fixture`: the expected set is the single live id the named
    fixture received at setup.
  Extraction rule: digits adjacent to "sc-" or standalone numbers in
  the answer's id positions; the exact regex lives in code, but the
  principle is fixed here: when extraction is ambiguous, the check
  fails — an unreadable answer is a failed answer, because a human
  reader would be equally lost.
- `workspace_unchanged` — diff the workspace against the attempt's
  own starting snapshot: no stories created, deleted, or moved beyond
  the task's fixtures. Comments added by the attempt count as changes.

**Measurements, recorded regardless of pass/fail:** tool calls (count
and full sequence from the transcript), invalid tool calls (nonexistent
tool named, or arguments the server rejected), input and output tokens
(from usage fields), wall-clock duration, driver id, lane id. The
scorecard set from STACK.md, per attempt, no composite score ever.

**Grade records** are appended to the attempt's JSONL transcript as a
final record and mirrored into bench.sqlite. Files remain the truth;
the database remains derived.

## Boundaries

- Deterministic only. No model call anywhere in grading, not even for
  extraction. If a future task cannot be graded deterministically, the
  task is out of scope, not the rule.
- Graders read the workspace and the transcript; they never write to
  the workspace. Teardown is the harness's job, after grading.
- Every live fetch the grader makes is recorded in the grade record
  (endpoint, timestamp), so a disputed grade can be re-litigated from
  its own receipts.
- Tolerances come only from the task file. Graders never invent slack.
- A grader crash marks the attempt `ungraded`, never `failed` — the
  difference between "the student failed" and "the examiner fainted"
  must be visible in every report.

## Done when

Grading runs against real attempts from the pilot sweep and, in
addition, against three hand-made adversarial transcripts committed as
test fixtures: one where the agent claims success but the workspace
shows nothing (must fail), one where the agent did the work but
described it badly (must pass — reality outranks prose), and one where
extraction is ambiguous (must fail with the ambiguity named). vitest
covers the tolerance edges: casing, date-window boundaries at midnight,
and the soft-deleted-comment filter.
