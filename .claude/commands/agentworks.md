---
description: Load full AgentWorks context, write STATUS.md, propose next steps
allowed-tools: Read, Grep, Glob, Write, Bash(git log:*), Bash(git ls-files:*)
---

Load the complete AgentWorks context:

1. Run `git ls-files` to see every file that exists in the repo.
2. Read docs/PROJECT.md, docs/STACK.md, docs/CONVENTIONS.md,
   docs/decisions.md, and every file in docs/specs/ if present.
   Read docs/PLAN.md.
3. Run `git log --reverse --format='%as %h %s'` for the full history.
4. Read the root package.json and every packages/*/package.json for
   installed versions.

Verify any claim about existing or missing files against the list from
step 1 before writing it. Never call a milestone done unless its own
completion condition is evidenced in the repo; for milestones with a
spec, that means the spec's "Done when", not the code merely existing.

Write the findings to STATUS.md at the repo root (overwrite, never
append), dated at the top, containing in this order:

- the project in one paragraph
- current phase, one line naming its next exit criterion, and one line
  pointing to docs/PROJECT.md for the full phase plan
- **Toolchain**: pinned versions from step 4 plus the pinned model from
  docs/decisions.md, one compact list
- open items from the Pending section of docs/decisions.md
- **Next steps**: from docs/PLAN.md, the first TODO step in order, plus
  at most the two after it. Quote each step's number, title, owner, and
  commit message as written; do not invent, reorder, or reword steps. If
  a step's owner is W, say it is waiting on the person. If PLAN.md
  appears wrong or blocked, say so in one line instead of substituting
  your own step.
- **Full history**: every commit from step 3, chronological, one line
  each, as a collapsed appendix at the very end

Show the same report in the conversation, then wait for approval before
building anything.
