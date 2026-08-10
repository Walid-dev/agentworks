# PLAN.md — the ordered step list

The single source of "what happens next". Steps run in order. A step is
marked DONE only when the evidence named in it exists in the repo.

**Rules**

- Never mark a step done without its evidence present.
- Never skip a step silently. If a step is wrong or unnecessary, amend
  this file in its own commit explaining why, then continue.
- Never invent steps. If work seems needed that no step covers, add it
  here first, with evidence and a commit message, then do it.
- Owner `W` means the person writes it; `AI` means Claude Code builds it
  and the person reviews the diff.
- Only the current phase is detailed. The next phase gets planned at its
  gate, because its steps depend on findings that don't exist yet.
- Evidence names an artifact in the repo (a file path, a tag, a working
  package), not a commit hash. A step and its evidence land in the same
  commit; hashes are what git already tracks.

---

## Phase 0 — Foundations by hand

### DONE

- **0.1 Bootstrap the repo and the project canon.**
  Evidence: `223b8ac`, plus docs/PROJECT.md, STACK.md, CONVENTIONS.md,
  decisions.md, EXPLAINED.md, CONCEPTS.md.

- **0.2 Write the intent spec for the bare agent loop.**
  Evidence: docs/specs/agent-loop.md.

- **0.3 Build the bare agent loop.**
  Evidence: packages/agent/src/index.ts, commit `064346f`.

- **0.4 Verify the loop end to end.**
  Evidence: docs/reports/agent-loop-first-run.md, commit `ca1d72d`.

- **0.5 Define `feat` vs `chore` in the conventions.** Owner: AI.
  Add to docs/CONVENTIONS.md, Commits section: `feat` adds a capability
  to the repo, including new packages or servers; `chore` is repo
  maintenance with no capability change.
  Evidence: docs/CONVENTIONS.md, commit `e2f2abb`.
  Commit: `docs: define feat vs chore`

- **0.6 Create the Shortcut workspace and API token.** Owner: W.
  Free workspace, generate an API token, put it in `.env` as
  `SHORTCUT_API_TOKEN`. Then remove that line from Pending in
  docs/decisions.md.
  Evidence: the Shortcut token line is absent from Pending in
  docs/decisions.md; the token lives in the local .env.
  Commit: `docs(decisions): resolve shortcut token item`

- **0.7 Write the intent spec for the hand-built Shortcut toolset.**
  Owner: **W** (per the spec-first decision; this content comes from
  real daily use, not from documents).
  Format follows docs/specs/agent-loop.md: Intent, What it does,
  Boundaries, Done when. 8 to 12 tools, each one a chore actually done
  in a normal week, with a plain-sentence description and the reason it
  exists. No code. Written **before** looking at any naive converter
  output, so the design stays chore-shaped rather than endpoint-shaped.
  Evidence: docs/specs/shortcut-handmade.md.
  Commit: `docs(specs): add hand-built shortcut toolset spec`

- **0.8 Build the hand-built server, first tool only.** Owner: AI.
  Create `servers/shortcut-handbuilt/` as a workspace package on
  `@modelcontextprotocol/sdk`, stdio transport, with exactly one working
  tool from the spec. The package is born with its first working tool,
  never as an empty shell.
  Evidence: servers/shortcut-handbuilt/src/index.ts, born with the
  whoami tool responding against the live API.
  Commit: `feat(servers): add hand-built shortcut server with first tool`

- **0.9a Build the read tools from the spec.** Owner: AI.
  Read tools: `list_workspace_vocabulary`, `list_my_stories`,
  `list_team_stories`, `find_stories`, `get_story`. Split before 0.9b
  because write tools mutate the real workspace, so the read half is
  verified first.
  One commit per tool or per small group. Each tool's description is
  written for a machine reader: what it does, when to use it, what it
  returns. Responses trimmed to the fields the chore needs.
  Evidence: servers/shortcut-handbuilt (all ten tools) plus
  docs/reports/shortcut-handbuilt-verification.md.
  Commit: `feat(servers): add <tool names> to hand-built shortcut server`

- **0.9b Build the write tools from the spec.** Owner: AI.
  Write tools: `create_story`, `move_story`, `comment_on_story`,
  `update_story`.
  One commit per tool or per small group. Each tool's description is
  written for a machine reader: what it does, when to use it, what it
  returns. Responses trimmed to the fields the chore needs.
  Evidence: servers/shortcut-handbuilt (all ten tools) plus
  docs/reports/shortcut-handbuilt-verification.md.
  Commit: `feat(servers): add <tool names> to hand-built shortcut server`

- **0.10 Verify the toolset inside a real AI assistant.** Owner: W.
  Register the server in Claude Code, then run the chores from the spec
  by conversation. Record the session: what was asked, which tools were
  called, what came back, what went wrong.
  Evidence: docs/reports/handbuilt-first-run.md.
  Commit: `docs(reports): record hand-built toolset verification`

- **0.11 Produce the naive baseline.** Owner: AI.
  Pick one existing OpenAPI-to-MCP converter, pin its exact version,
  point it at Shortcut's public spec, and save the raw generated output
  under `servers/naive/`. No editing of the output; the point is what
  the shortcut actually produces.
  Evidence: servers/naive/ contains the generated server;
  docs/reports/naive-converter-survey.md records the converter
  selection; the converter name and version are recorded in
  docs/decisions.md.
  Commit: `feat(servers): add naive baseline from <converter> <version>`

- **0.12 Try the same chores against the naive server.** Owner: W.
  Register the naive server in Claude Code and attempt the same chores
  from step 0.10. Record what happened, especially wrong tool choices,
  confusion, and dead ends.
  Evidence: docs/reports/naive-first-run.md plus docs/reports/raw/.
  Commit: `docs(reports): record naive baseline session`

- **0.14 Close the phase.** Owner: W.
  Confirm the exit criterion is met: the hand-made toolset works inside
  a real AI assistant, and a written comparison characterizes, with
  evidence, how it differs from the naive conversion and what Phase 1
  must measure. Tag the commit `phase-0`. Then write the Phase 1 step
  list into this file, informed by what steps 0.10 to 0.13 revealed.
  Evidence: the exit-criterion check (Part A) confirms all three
  amended clauses are met against docs/reports/handbuilt-first-run.md
  and docs/reports/handbuilt-vs-naive.md.
  Commit: `docs(plan): close phase 0 and plan phase 1`

### TODO

- **0.13 Write the comparison.** Owner: AI drafts, W reviews and edits.
  Short report contrasting the two toolsets using the two session
  records: tool count, naming, description quality, response size, and
  where each one helped or hurt the assistant. Concrete examples only,
  no adjectives without evidence. Names the specific failure modes worth
  measuring in Phase 1.
  Evidence: docs/reports/handbuilt-vs-naive.md.
  Commit: `docs(reports): compare hand-built and naive toolsets`

---

## Phase 1 — The measuring instrument

The measuring instrument, built spec-first. Every attempt is amnesiac
per chore; every call is recorded; graders verify against ground truth
in the live workspace, deterministically. LLM-as-judge is out of scope
for Phase 1. Tasks and harness are AI-authored under human review, same
provenance disclosure as the curated toolset.

### DONE

- **1.1 Write the golden-task format spec.** Owner: W.
  Format follows `docs/specs/agent-loop.md`: Intent, What it does,
  Boundaries, Done when. Defines the YAML shape for a golden task:
  phrasing (with pinned timezone where relevant), expected tool names
  (candidates), grader block (deterministic checks against Shortcut
  ground truth), tolerance declarations (casing, date-window), and
  the disclosure that tasks are AI-authored under human review. No code.
  Evidence: `docs/specs/golden-task-format.md`.
  Commit: `docs(specs): add golden-task format spec`

- **1.2 Write the harness spec.** Owner: W.
  Format matches 1.1. Defines the harness runtime: per-chore
  isolation, driver pinning at attempt-time, full call logging
  (name / input / output / timestamp per call), transcript to JSONL
  under `runs/`, metrics to `runs/bench.sqlite`. Two agent runtimes:
  bare loop (from `packages/agent`) and Agent-SDK lane (optional).
  Excludes LLM-as-judge. No code.
  Evidence: `docs/specs/harness.md`.
  Commit: `docs(specs): add harness intent spec`

- **1.3 Write 3 pilot golden tasks by hand.** Owner: W.
  Three tasks written to the format from 1.1, drawn from the Phase 1
  candidates in `handbuilt-vs-naive.md §8`: one that exercises the
  type-vs-name trap; one write-chore that pins timezone in phrasing
  (deadline test from §5b); one that probes information loss vs
  coordination cost. Each with its deterministic grader block.
  Evidence: `tasks/pilot-state-trap.yaml`,
  `tasks/pilot-deadline-write.yaml`, `tasks/pilot-info-vs-cost.yaml` —
  three files, zod-validated against the format spec.
  Commit: `feat(tasks): add three pilot golden tasks`

- **1.4 Build the golden-task loader with zod validation.** Owner: AI.
  Minimal package `packages/harness` that reads the pilot YAMLs from
  1.3 and validates them against a zod schema derived from the 1.1
  spec. Loader only; no runner yet.
  Evidence: `packages/harness` with `tasks validate` command passing
  on the three pilots
  (`packages/harness/src/tasks.ts` + `packages/harness/src/cli.ts`).
  Commit: `feat(harness): add golden-task loader with zod validation`

- **1.5 Write the graders spec.** Owner: W.
  Format matches 1.1 and 1.2. Defines the deterministic grader
  contract for turning one finished attempt into pass/fail plus
  measurements: per-check semantics (`story_exists`, `story_absent`,
  `comment_on`, `answer_ids` with `equals_state`/`equals_fixture`,
  `workspace_unchanged`), tolerance handling, measurement set,
  boundaries (deterministic-only, no writes, receipts on every fetch,
  ungraded vs failed distinction). No code.
  Evidence: `docs/specs/graders.md`.
  Commit: `docs(specs): add graders spec`

- **1.6 Build the runner against the bare loop.** Owner: AI.
  Extend `packages/harness` to run one golden task once against one
  MCP server, using the bare loop from `packages/agent` as the agent
  runtime. Per-attempt: log every tool call to JSONL under
  `runs/<timestamp>-<task>/`; record driver id, server id,
  timestamps, token counts (from Anthropic API `usage`). No graders
  yet. **Pin the `dev` driver id (used for Phase 1 iteration) and the
  `official` driver id (whose numbers appear in Report #1) here as
  their first actual use, per STACK.md's pin-at-first-use rule; both
  recorded as one-liners in `docs/decisions.md`.**
  Evidence: `packages/harness/src/attempt.ts` plus `runtime.ts`,
  `baseline.ts`, `setup.ts`, `teardown.ts`, `logger.ts`, `lanes.ts`;
  the passing verification transcript at
  `runs/2026-08-10T21-18-33-388Z/state-name-vs-type/shortcut-handbuilt/2026-08-10T21-18-33-388Z.jsonl`;
  the `2026-08-10` headline-driver line in `docs/decisions.md`
  pinning `claude-sonnet-4-6` (dev tier already pinned 2026-08-03).

- **1.7 Build the deterministic grader base.** Owner: AI.
  Implement the grader contract from 1.5. Reads a JSONL transcript +
  a golden task's grader block and returns pass/fail per task, plus
  derived measurements: task-success (verified against Shortcut REST
  as ground truth), tool-selection accuracy against expected tool
  names, tool-calls-per-task, tokens in/out, wall-clock latency
  (within same transport), invalid tool calls (nonexistent name or
  arg-schema breakage). Casing and date-window tolerances honored per
  task declaration. **Isolation inside the harness (course-reset
  applied per attempt): each repetition uses unique story identifiers
  and tears down its own created artifacts between attempts; the
  workspace must match the documented baseline before the next
  attempt begins. Teardown verification is required evidence, not
  assumed.**
  Evidence: `packages/harness/src/{graders,storage,vocabulary,setup}.ts`
  plus the `sweep` and `sqlite rebuild` commands in `cli.ts`; partial
  sweep at `runs/2026-08-10T21-55-15-539Z/` (15/18 attempts completed;
  credit exhausted mid-rep-3) — grader-functionality evidence only,
  not pilot results; clean pilot runs at 1.8. `bench.sqlite` is
  derived and disposable (per docs/specs/harness.md), rebuildable from
  the JSONL via `bench sqlite rebuild <sweep-dir>`; the JSONL is the
  truth and is committed under `runs/`. Teardown-verification log at
  `runs/2026-08-10T21-55-15-539Z/teardown-log.jsonl` with every
  completed attempt's baseline re-verify; live workspace clean
  (10 baseline stories) after the sweep; unit tests for the tolerance
  edges (`packages/harness/src/graders.test.ts`).

### TODO

- **1.8 Pilot review and format lock.** Owner: W.
  Read the three pilot runs' outputs. Confirm the golden-task format
  and the harness produce the intended discrimination: chores in the
  §8 categories separate curated from naive on at least one measured
  axis. If they do not, revise the format spec (1.1) or the graders
  (1.7) before mass authoring. This is the gate before scaling from 3
  to ~20 tasks.
  Evidence: `docs/reports/phase1-pilot-review.md`, ending with an
  explicit "format locked" line or a list of revisions and the follow-up
  commits landing them.
  Commit: `docs(reports): lock phase 1 golden-task and harness format`

- **1.9 Author the full golden-task set (20 to 25 tasks).** Owner: AI.
  Author the remaining golden tasks per the locked format, covering
  every §8 candidate class. Each task's grader block deterministic
  against Shortcut ground truth; tolerances declared explicitly.
  Disclosure: tasks are AI-authored under human review, per the same
  provenance line the curated toolset carries.
  Evidence: `tasks/*.yaml` — 20 to 25 files total (pilots included),
  all zod-validating.
  Commit: `feat(tasks): add remaining phase 1 golden tasks`

- **1.10 Run the two-lane sweep and produce Benchmark Report #1
  (curated vs naive).** Owner: AI.
  Full sweep on the two local stdio lanes only: every golden task ×
  two lanes (curated, naive) × N repetitions × two driver tiers
  (`official` from step 1.6 for the numbers in the report; `smoke`
  for the sanity sweep and the cheap-tier axis). **Pin the `smoke`
  driver id here as its first actual use, per STACK.md's
  pin-at-first-use rule; recorded in `docs/decisions.md`.** Compare
  the two lanes across the metric set in `docs/STACK.md` "Metrics".
  No verdict beyond what the numbers say; the report is the numbers.
  Evidence: `docs/reports/benchmark-1.md` plus `runs/bench.sqlite`;
  one new decisions.md line pinning the `smoke` driver id.
  Commit: `docs(reports): benchmark report 1`

- **1.11 Add the official Shortcut MCP as a third lane and reissue.**
  Owner: AI.
  The official Shortcut MCP is an **external boundary** — a remote
  server we do not control — so it gets its own step. A connection
  failure cannot block the headline report from 1.10. Wire the
  remote server over the streamable-HTTP transport in
  `@modelcontextprotocol/sdk`; no editing on the official side.
  **Connectivity/auth verify gate: the harness must successfully
  connect, list tools, and complete one read call against the
  official server before any sweep runs.** Then re-run the full
  sweep across all three lanes (curated, naive, official) at the
  same tier settings as 1.10, and produce a reissued report.
  Evidence: `docs/reports/benchmark-1-with-official.md` plus the
  reissued `runs/bench.sqlite`; server identity and version (as
  surfaced by the remote) recorded in `docs/decisions.md`.
  Commit: `docs(reports): benchmark report 1 with official lane`

- **1.12 Close Phase 1.** Owner: W.
  Confirm the exit criterion is met: Benchmark Report #1 (the
  two-lane report from 1.10) exists, with real numbers, and the
  format is stable enough to run again on the monthly upgrade day.
  The official-lane reissue from 1.11 is a **bonus, not a gate** —
  its presence or absence does not affect phase closure. Tag
  `phase-1`. Draft the Phase 2 step list into this file, informed by
  what Report #1 revealed and the pending refiner-aggressiveness
  axis (see `docs/decisions.md` 2026-08-08).
  Evidence: the `phase-1` tag exists and this file contains a
  Phase 2 step list.
  Commit: `docs(plan): close phase 1 and plan phase 2`

---

## Phase 2 and later

Planned at each phase gate, not before. The phase goals and exit
criteria live in docs/PROJECT.md.
