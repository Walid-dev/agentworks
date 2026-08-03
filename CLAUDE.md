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

## Current state
Phase 0. Active package: packages/agent (bare tool-use loop).
Exact status: `git log --oneline -10` plus Pending in docs/decisions.md.
