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
- Facts that change over time have exactly one owning document;
  everywhere else points at it. Before writing such a fact, ask which
  document owns it: goals -> PROJECT.md, architecture and stack ->
  STACK.md, working rules -> CONVENTIONS.md, choices -> decisions.md,
  steps and progress -> PLAN.md. Stable rules may be restated for
  convenience; anything that changes must be linked, never copied.

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

## After every commit
Append a report to REPORT.md at the repo root (gitignored). Never
overwrite — a session can contain several commits. Separate reports
with a horizontal rule and use the commit hash as a heading. Each
report contains, in this order:

0. Heading: the short hash AND the full commit line as the report title.
1. In plain words: two or three sentences a non-technical reader follows.
2. Which docs/PLAN.md step this belongs to, or "repo tooling".
3. Decisions the canon did not dictate, with reasoning, and whether each
   was logged. Write "none" only if literally nothing was chosen.
4. Findings that contradicted an assumption.
5. Untested paths, exhaustive.
6. Verification: exact commands and raw output, but only for what this
   commit changed. Lint and typecheck get one line, pass or fail, output
   only on failure.
7. Open questions.
8. Files changed: the --stat list only. Full diffs live in git; include a
   diff hunk inline only when a section above discusses it.

In the conversation, print only a two-line summary: the commit line, and
anything in sections 4, 5, or 7 that needs attention.

Report what happened, not what was intended. Nothing is called verified
without its output present in section 6. State uncertainty plainly.

## Current state
The current phase and the next step are in docs/PLAN.md: the first TODO
step in order. Recent work: `git log --oneline -10`.
