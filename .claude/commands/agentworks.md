---
description: Load full AgentWorks context, write STATUS.md, propose next steps
allowed-tools: Read, Grep, Glob, Write, Bash(git log:*), Bash(git ls-files:*)
---

Load the complete AgentWorks context:

1. Run `git ls-files` to see every file that exists in the repo.
2. Read docs/PROJECT.md, docs/STACK.md, docs/CONVENTIONS.md,
   docs/decisions.md, and every file in docs/specs/ if present.
3. Run `git log --reverse --format='%as %h %s'` for the full history.
4. Read the root package.json and every packages/*/package.json for
   installed versions.

Verify any claim about existing or missing files against the list from
step 1 before writing it.

Write the findings to STATUS.md at the repo root (overwrite, never
append), dated at the top, containing in this order:

- the project in one paragraph
- **Progress map**: every phase from PROJECT.md's plan, in order. Under
  each phase, its concrete milestones as a checklist. Mark ✅ only when
  verifiable evidence exists in the repo (a file, a merged commit, a
  report); mark ⬜ otherwise; mark the single milestone currently in
  flight with ▶. Under each ✅, one indented line naming its evidence.
  Never invent milestones: derive them from the phase descriptions and
  exit criteria in PROJECT.md.
- current phase and its next exit criterion
- **Toolchain**: pinned versions from step 4 plus the pinned model from
  docs/decisions.md, one compact list
- open items from the Pending section of decisions.md
- Recommended next steps: the 1 to 3 most useful concrete actions,
  judged against the current phase exit criteria, most valuable first,
  with a one-line reason and a proposed Conventional Commit message for
  each
- **Full history**: every commit from step 3, chronological, one line
  each, as a collapsed appendix at the very end

Show the same report in the conversation, then wait for approval before
building anything.
