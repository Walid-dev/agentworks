# Decision log

One line per decision: date — decision — why. Newest on top.

## Decided

- 2026-08-04 — Finish line reframed: measured shrinking gap to Official,
  parity as stretch — official toolsets embed non-public knowledge; the
  defensible claim is quantified approach, not victory.
- 2026-08-03 — Loop dev model: claude-sonnet-4-6 via ANTHROPIC_MODEL env — dev tier; official benchmark model chosen at Phase 1.
- 2026-08-03 — Spec-first for core components (Option B): agent loop, harness, graders, Designer prompts each get a short intent spec in docs/specs/ before AI builds; first spec supplied as template — stated intent makes review catch drift. Commits: docs(specs): add agent loop spec and chore(repo): command v2 writes STATUS.md and proposes next steps.
- 2026-08-03 — Toolchain pinned: pnpm 11.20.0, typescript 7.0.2, tsx 4.23.4, vitest 4.1.10, biome 2.5.6 — recorded at first install; lockfile is the source of truth.
- 2026-08-03 — Phase 0 loop authorship: Claude Code may write the code from Walid's own written spec; understanding proven by solo exercises (predict, extend, break, rebuild) — typing optional, comprehension not.
- 2026-08-02 — Name: AgentWorks (supersedes Agentworthy, Forgebench; AgentCalibre considered) — 'the works' that build toolsets plus the 'it works' the Examiner proves; free on npm, verified twice; 'agentworthy' stays lowercase as the verdict grade in reports.
- 2026-08-02 — Conventions v1 adopted (docs/CONVENTIONS.md) — decided once, argued never.
- 2026-08-02 — Repository private until Phase 4 — publish together with the benchmark essay.
- 2026-08-02 — Benchmark target: Shortcut via a free workspace — public API, official server to beat, daily intuition for golden tasks.
- 2026-08-02 — Stack per docs/STACK.md (TS strict, pnpm workspaces, MCP SDK, zod, SQLite + Drizzle, Biome defaults) — boring core, zero infrastructure.

## Pending

- Claude plan tier — leaning Pro; confirm against real usage after Phase 1.
- Embeddings provider — Phase 2 gate (Voyage vs OpenAI).
- OpenAI cross-model lane — Phase 3 gate.
- License — decide at Phase 4 with publication.
