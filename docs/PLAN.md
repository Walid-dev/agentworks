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
  Evidence: docs/CONVENTIONS.md, commit `90d3937`.
  Commit: `docs: define feat vs chore`

### TODO

- **0.6 Create the Shortcut workspace and API token.** Owner: W.
  Free workspace, generate an API token, put it in `.env` as
  `SHORTCUT_API_TOKEN`. Then remove that line from Pending in
  docs/decisions.md.
  Evidence: the Pending line is gone from docs/decisions.md.
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
  Evidence: the package exists and starts; one tool responds.
  Commit: `feat(servers): add hand-built shortcut server with first tool`

- **0.9 Build the remaining tools from the spec.** Owner: AI.
  One commit per tool or per small group. Each tool's description is
  written for a machine reader: what it does, when to use it, what it
  returns. Responses trimmed to the fields the chore needs.
  Evidence: every tool in the spec exists in the package.
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
  Evidence: `servers/naive/` contains the generated server; the
  converter name and version are recorded in docs/decisions.md.
  Commit: `feat(servers): add naive baseline from <converter> <version>`

- **0.12 Try the same chores against the naive server.** Owner: W.
  Register the naive server in Claude Code and attempt the same chores
  from step 0.10. Record what happened, especially wrong tool choices,
  confusion, and dead ends.
  Evidence: docs/reports/naive-first-run.md.
  Commit: `docs(reports): record naive baseline session`

- **0.13 Write the comparison.** Owner: AI drafts, W reviews and edits.
  Short report contrasting the two toolsets using the two session
  records: tool count, naming, description quality, response size, and
  where each one helped or hurt the assistant. Concrete examples only,
  no adjectives without evidence. Names the specific failure modes worth
  measuring in Phase 1.
  Evidence: docs/reports/handbuilt-vs-naive.md.
  Commit: `docs(reports): compare hand-built and naive toolsets`

- **0.14 Close the phase.** Owner: W.
  Confirm the exit criterion is met: the hand-made toolset works inside
  a real AI assistant, and the written comparison explains why it beats
  the naive one. Tag the commit `phase-0`. Then write the Phase 1 step
  list into this file, informed by what steps 0.10 to 0.13 revealed.
  Evidence: the `phase-0` tag exists and this file contains a Phase 1
  step list.
  Commit: `docs(plan): close phase 0 and plan phase 1`

---

## Phase 1 and later

Planned at each phase gate, not before. The phase goals and exit
criteria live in docs/PROJECT.md.
