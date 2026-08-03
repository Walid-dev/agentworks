---
description: Load full AgentWorks context, write STATUS.md, propose next steps
allowed-tools: Read, Grep, Glob, Write, Bash(git log:*), Bash(git ls-files:*)
---

Load the complete AgentWorks context:

1. Run `git ls-files` to see every file that exists in the repo.
2. Read docs/PROJECT.md, docs/STACK.md, docs/CONVENTIONS.md,
   docs/decisions.md, and every file in docs/specs/ if present.
3. Run `git log --oneline -15` to see recent work.

Verify any claim about existing or missing files against the list from
step 1 before writing it.

Write the findings to STATUS.md at the repo root (overwrite, never append),
dated at the top, containing:
- the project in one paragraph
- current phase and its next exit criterion
- open items from the Pending section of decisions.md
- Recommended next steps: the 1 to 3 most useful concrete actions, judged
  against the current phase exit criteria, most valuable first, with a
  one-line reason and a proposed Conventional Commit message for each

Show the same report in the conversation, then wait for approval before
building anything.
