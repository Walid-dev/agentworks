# Handbuilt Shortcut toolset — first-run exam

**Date:** 2026-08-07.

## Exam rig

Per docs/EXAM.md:

- Isolated session launched via `claude --strict-mcp-config --mcp-config <path>` from an empty folder outside the repo (`~/agentworks-exam`).
- No CLAUDE.md or project rules loaded.
- `/mcp` confirmed exactly one server connected: `shortcut-handbuilt`.
- No global servers, no connectors.

## Chores

### Chore 1 — "What am I working on?"

**Exact phrasing:** "What am I working on?"

**Assistant:** listed 1 directory, recalled 1 memory. Replied it had no
prior-conversation memory, noted `~/agentworks-exam` is empty and
`~/Desktop/agentworks/packages/agent` has a TypeScript project, and
asked what I'm working on.

**User clarifier:** "in shortcut"

**Assistant (after clarifier):** called `shortcut-handbuilt` once.
Replied:

- In Progress: #17 Get Started with Shortcut — due 2026-08-13
- In Review: #23 Accelerate your team with Agents
- To Do: #22 Connect in Slack
- Backlog: #30 Connect in Slack

Noted #17 is the only story in progress with a deadline next week.

**Tools called:** 1 (after clarifier).

**Finding:** The bare phrasing was ambiguous between files, session
memory, and tools; the assistant reached for files and memory first.
A minimal clarifier "in shortcut" resolved it. **Golden-task phrasing
in Phase 1 must be fair about WHERE to act without naming tools.**

### Chore 2 — "Show me the team's board."

**Exact phrasing:** "Show me the team's board."

**Assistant:** called `shortcut-handbuilt` once. Replied with
Walid Hl's Team Board (10 stories) grouped by state:

- In Progress: #17 (due 2026-08-13)
- In Review: #23
- To Do: #21 (flagged overdue 2026-07-09), #18 (due 2026-08-21), #20, #22, #24, #25
- Backlog: #30
- Done: #19

Proactively flagged #21 past due and #30 as a possible duplicate of #22.

**Tools called:** 1.

### Chore 3 — "Open the Slack story and tell me where it stands."

**Exact phrasing:** "Open the Slack story and tell me where it stands."

**Assistant:** noted there are two Slack stories (#22 and #30) and
checked both. Called `shortcut-handbuilt` twice. Replied:

- #22 — chore, To Do, owner walidhl, onboarding Slack-integration
  story, tasks Investigation/Implementation/Review all incomplete,
  relates to #23, no comments.
- #30 — feature, Backlog, empty description, no tasks/comments/links,
  "looks like an accidental duplicate."

Verdict: #22 is the real story, not started; #30 an empty duplicate
that could be deleted or archived. Offered to move #22 to In Progress
or clean up #30.

**Tools called:** 2.

**Finding:** The assistant detected both candidates, investigated both
via `get_story`, identified #22 as real from evidence (tasks, link,
description) and #30 as an empty duplicate, and proposed cleanup
unprompted. **Enabled by `get_story` returning full judgment context in
one call.**

### Chore 4 — "Add a comment on story 17: found the cause, it's the cache."

**Exact phrasing:** "Add a comment on story 17: found the cause, it's the cache."

**Assistant:** called `shortcut-handbuilt` once. "Comment added to #17
as walidhl."

**Tools called:** 1.

### Chore 5 — "Create a story called Fix login timeout for my team, assign it to me, with three tasks: reproduce, fix, verify. Due Friday"

**Exact phrasing:** "Create a story called Fix login timeout for my
team, assign it to me, with three tasks: reproduce, fix, verify. Due
Friday"

**Assistant:** stated "Today is Friday 2026-08-07 — I'll interpret
Friday as next Friday, 2026-08-14." Called `shortcut-handbuilt` once.
"Created #49 Fix login timeout — bug, To Do, owner: walidhl, due
2026-08-14, with tasks reproduce, fix, verify."

**Tools called:** 1.

**Finding:** One natural sentence became one atomic `create_story`
call with title, team, owner, three tasks, and due date. The model
inferred two things without being told:

- `story_type: "bug"` — never specified in the phrasing.
- "Friday" — interpreted as the next Friday (2026-08-14) rather than
  today (also a Friday), and stated its interpretation explicitly
  before acting.

**Phase 1 golden tasks must pin or tolerate such inferences** (e.g.,
accept any `story_type` in the grader, or specify one in the phrasing;
freeze the "today" clock or accept any Friday within a window).

### Chore 6 — "Move that story to in progress."

**Exact phrasing:** "Move that story to in progress."

**Assistant:** called `shortcut-handbuilt` once. "#49 → In Progress."

**Tools called:** 1.

### Chore 7 — "Update its description with: happens only on Safari, cache-related."

**Exact phrasing:** "Update its description with: happens only on
Safari, cache-related."

**Assistant:** called `shortcut-handbuilt` once. "Description updated
on #49."

**Tools called:** 1.

**Finding (chores 6 and 7):** The assistant resolved "that story" and
"its" to #49 from session context, one tool call each, no re-lookup.

## Environment observations for Phase 1

- Session start showed a memory recall ("recalled 1 memory") and a
  directory listing before any tool use.
- Claude Code produced "recap" interludes between chores.

The Phase 1 runtime (bare loop) has neither of these: it must start
amnesiac per attempt, and it has no product features around the loop.
These behaviours are the ambient of the exam host (Claude Code), not
of the toolset under test — Phase 1's runtime must not simulate them.

## Evidence left in the workspace

Not cleaned up — per EXAM.md purity rules, these are exam evidence:

- Story **#49** "Fix login timeout" — In Progress, due 2026-08-14,
  three tasks (reproduce, fix, verify), owner `walidhl`, description
  "happens only on Safari, cache-related".
- Comment on story **#17**: "found the cause, it's the cache." — author
  `walidhl`.

## Totals

- Chores completed: 7 of 7.
- Tool calls: 8 total (chore 1: 1 after clarifier; chore 2: 1;
  chore 3: 2; chores 4–7: 1 each).
- Clarifiers required: 1 (chore 1).
- Model inferences worth noting: 2 (chore 5: `story_type`, "Friday").
