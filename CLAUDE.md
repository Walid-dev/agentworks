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

## Proposing work
Before proposing any action, state which document authorizes it (file and
section). If no document does, don't propose it: name the gap in one line
and ask. Proposals must be traceable to the canon, not inferred from what
seems useful.

## After every commit
Append a report to REPORT.md at the repo root (gitignored). Never
overwrite — a session can contain several commits. Separate reports
with a horizontal rule and use the commit hash as a heading. Each
report contains, in this order:

1. The commit line, and which docs/PLAN.md step it belongs to.
2. `git show --stat` for the commit.
3. Decisions taken that the canon did not dictate, with reasoning, and
   whether each was logged in docs/decisions.md.
4. Findings: anything the live API, tooling, or code revealed that
   contradicted an assumption.
5. Untested paths: code written but never executed, and what would
   exercise it. Be exhaustive; this section is the one most likely to be
   under-reported.
6. Verification: the exact commands run and their raw output. Never
   summarise output a reader would want to see.
7. Open questions: anything decided by default that a human should
   confirm.
8. `git show` for the commit, excluding pnpm-lock.yaml.

In the conversation, print only a two-line summary: the commit line, and
anything in sections 4, 5, or 7 that needs attention.

Report what happened, not what was intended. Nothing is called verified
without its output present in section 6. State uncertainty plainly.

## Current state
Phase 0. Active package: packages/agent (bare tool-use loop).
Exact status: `git log --oneline -10` plus Pending in docs/decisions.md.
