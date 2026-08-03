# CONVENTIONS.md

Decided once, argued never. Change only via an entry in `decisions.md`.

## Commits — Conventional Commits

Format: `type(scope): imperative summary` (lowercase, no period, aim under 72 chars).

- Types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `perf`
- Scopes: package or area — `agent`, `harness`, `designer`, `builder`, `cli`, `servers`, `tasks`, `docs`, `repo`
- Body: only when the "why" isn't obvious from the summary.
- Examples:
  - `feat(agent): add tool-result loop with retry`
  - `docs(decisions): pin initial toolchain versions`
  - `test(harness): grader verifies story creation against shortcut`

## Branching & tags

- Trunk-based: commit to `main`. Branches only for risky experiments, named `exp/<topic>`.
- Tag every phase exit: `phase-0`, `phase-1`, ...

## TypeScript

- `camelCase` for variables and functions; `PascalCase` for types, classes, enums, zod schemas; `UPPER_SNAKE_CASE` for true module constants.
- Filenames: `kebab-case.ts` (avoids case-sensitivity git traps).
- Named exports only. No default exports.
- `type` by default; `interface` only for implementable contracts (e.g. `AgentRuntime`).
- Zod pattern: schema + inferred type live together:
  `export const GoldenTaskSchema = z.object({...}); export type GoldenTask = z.infer<typeof GoldenTaskSchema>;`
- `strict: true` everywhere; `unknown` at boundaries, never `any`.

## Formatting & linting

- Biome defaults are law. Zero overrides. `pnpm lint` and `pnpm format` must pass before commit.

## Decision log

- `docs/decisions.md`, one line per decision: `date — decision — why`. Newest on top.

## Language

- English everywhere: code, comments, commits, docs.
