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
  Example:
  curl -sH "Shortcut-Token: $(grep SHORTCUT_API_TOKEN .env | cut -d= -f2)" \
    https://api.app.shortcut.com/api/v3/member | jq

## Proposing work
Before proposing any action, state which document authorizes it (file and
section). If no document does, don't propose it: name the gap in one line
and ask. Proposals must be traceable to the canon, not inferred from what
seems useful.

## Current state
Phase 0. Active package: packages/agent (bare tool-use loop).
Exact status: `git log --oneline -10` plus Pending in docs/decisions.md.
