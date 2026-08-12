# AgentWorks

Compiles APIs into agent-worthy MCP toolsets and proves the result with
benchmarks: a generation pipeline (Designer, Builder) plus an evaluation
harness (the Examiner) that measures generated servers against naive and
official baselines.

## Reference documents
- docs/PROJECT.md — scope, goals, phase plan
- docs/STACK.md — architecture, stack, exclusions
- docs/CONVENTIONS.md — commits, naming, formatting
- docs/decisions.md — decision log; check Pending before proposing changes

Full context load on demand: /agentworks

## Engineering rules
- TypeScript strict. Conventional Commits. Biome defaults. English everywhere.
- Excluded by design (rationale in STACK.md): agent frameworks (LangChain,
  LangGraph, AI SDK), server infrastructure (Postgres, Redis, Docker),
  eval SaaS, dashboards.
- Dependencies and model IDs stay pinned; upgrades only on the monthly
  upgrade day, gated by the eval suite.
- Every non-trivial choice gets one line in docs/decisions.md, newest on top.
- Run pnpm lint and pnpm typecheck before every commit; both must pass.
- For any tool touching an external API, confirm the real response shape
  with a live call before finalizing types. Record surprises in the
  tool's spec or the report.
- Always include the exact verification command in the final response,
  copy-pasteable, reading secrets from .env rather than inlining them.
  Scripts that import workspace packages must live inside the package's
  directory — Node resolves modules by walking up from the script's
  location, so a script in /tmp cannot see the package's node_modules.
- Claims bind at commit time; the index is a workbench. Staged content
  may anticipate the commit that makes it true.
- Facts that change over time have exactly one owning document;
  everywhere else points at it. Before writing such a fact, ask which
  document owns it: goals -> PROJECT.md, architecture and stack ->
  STACK.md, working rules -> CONVENTIONS.md, choices -> decisions.md,
  steps and progress -> PLAN.md. Stable rules may be restated for
  convenience; anything that changes must be linked, never copied.
- CI runs lint, typecheck, and tests on every push. A red main is the
  next thing fixed before any new work. CI never holds secrets and
  never makes paid or live-workspace calls.
- Provider-specific code (SDKs, env names, response shapes) lives only
  inside runtime implementations behind the AgentRuntime interface.
  Task files, graders, storage, isolation, and the transcript's
  canonical fields stay provider-neutral. Anything Anthropic-shaped
  above the runtime boundary is a review-blocking defect.
- API spend is budgeted per step. Before any step that makes model
  calls, state the expected cost from measured per-attempt numbers
  (input+output tokens × current pinned driver price); if actual
  spend approaches 3x the estimate, STOP and ask. Model-call scope
  is exactly what the instruction names: three attempts means three;
  a sweep is never run unless the instruction says sweep. Debugging
  never re-runs paid attempts in a loop — fix against recorded
  transcripts (replays are free) and re-run once to confirm. Every
  paid sweep is preceded by a dry-run of the identical configuration,
  same tasks, same lanes; the sweep does not start until the dry-run
  is green.

## Proposing work
Before proposing any action, state which document authorizes it (file and
section). If no document does, don't propose it: name the gap in one line
and ask. Proposals must be traceable to the canon, not inferred from what
seems useful.

- When an external system likely has its own answer to a design
  question (a default, a limit, a required order), check the live
  system for it before inventing one. If the canon is silent and the
  system is too, ask before choosing; a chosen default is a decision,
  and decisions belong to the human.
- Instructions arrive carrying factual premises: what exists, what a
  file says, counts, prior state, costs. Verify every checkable
  premise against the repo before executing; a false premise STOPS
  the work with the discrepancy named and evidence quoted (the
  exit-criterion reconcile is the model). Disagreement with an
  instruction's judgment is different: raise it once, in one line,
  then defer to the human's ruling.

## Committing
Write REPORT.md only when asked, and OVERWRITE it every time. Scope:
unless a different scope is named, cover the work currently in flight —
normally the docs/PLAN.md step being worked on, including all its
commits, any uncommitted changes, and repo-tooling commits made along
the way. Open the report by declaring the scope chosen: the step, then
each covered commit as hash + full commit line. Sections: in plain
words; plan step; decisions not dictated by the canon; findings that
contradicted an assumption; untested paths, accumulated across the whole
scope; verification with raw output only for what changed, lint and
typecheck as one pass/fail line; open questions; files changed as --stat
across the scope.

## Current state
The current phase and the next step are in docs/PLAN.md: the first TODO
step in order. Recent work: `git log --oneline -10`.
