---
description: Load full AgentWorks context, write STATUS.md, propose next steps
allowed-tools: Read, Grep, Glob, Write, Bash(git log:*)
---

Load the complete AgentWorks context:

1. Read docs/PROJECT.md, docs/STACK.md, docs/CONVENTIONS.md,
   docs/decisions.md, and every file in docs/specs/ if present.
2. Run `git log --oneline -15` to see recent work.

Write the findings to STATUS.md at the repo root (overwrite, never append),
dated at the top, containing:
- the project in one paragraph
- current phase and its next exit criterion
- open items from the Pending section of decisions.md
- anything in recent commits that breaks conventions
- Recommended next steps: the 1 to 3 most useful concrete actions, judged
  against the current phase exit criteria, most valuable first, one-line
  reason each

Show the same report in the conversation, then wait for approval before
building anything.
