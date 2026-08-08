# Naive Shortcut baseline — first-run exam

**Date:** pilots on 2026-08-07 (Run A) and 2026-08-08 (Run B); course
reset and canonical run pending as of 2026-08-08.

## Exam rig

Per docs/EXAM.md:

- Isolated session launched via
  `claude --strict-mcp-config --mcp-config <path>` from an empty folder
  outside the repo (`~/agentworks-exam/`).
- No CLAUDE.md or project rules loaded.
- `/mcp` confirmed exactly one server connected: `shortcut-naive`.
- Tool count reported by the protocol: **143** (matches the source in
  `servers/naive/src/index.ts`).

## Part 1 — Pilot runs (disclosed)

**Both pilots ran on a contaminated course (sc-49 and exam residue
present); they produced the course-reset rule now in EXAM.md and are
superseded for comparison purposes by the canonical run below.**
Findings here are recorded as **leads**, n=1, retained for the Phase 1
golden-task design decisions they surfaced.

### Run A — all seven chores, contaminated course

**Raw transcript:** [`raw/naive-run-a.txt`](raw/naive-run-a.txt).

Story sc-49 ("Fix login timeout") from the earlier hand-built exam
(0.10) was still present. Chores 5–7 (create / move / update) tested
the naive server's **duplicate-detection** behaviour, not create-write.
Chores 5–7 in Run A are **supplementary**; chores 1–4 are the
comparable portion.

- **Chores 1–4** (comparable): "What am I working on?" (with the same
  "in shortcut" clarifier the curated lane needed) → team board →
  open-the-Slack-story → comment on sc-17.
- **Chores 5–7** (supplementary): the assistant detected sc-49 as an
  exact match of the create request and stopped to ask; the move and
  update chores reported "no change needed" against sc-49's existing
  state.

### Course reset between pilots

Between Run A and Run B, sc-49 was deleted so Run B could start against
a cleaner course. A snapshot file `sc49-final-state.json` was intended
to capture the pre-deletion state; **the snapshot file was lost before
archiving.** sc-49's final pre-deletion state is documented **verbatim
in Run A's chore-5 exact-match listing** in
[`raw/naive-run-a.txt`](raw/naive-run-a.txt) (the "This is an exact
match — sc-49 already has:" block).

### Run B — chores 5–7 on a partially clean course

**Raw transcript:** [`raw/naive-run-b.txt`](raw/naive-run-b.txt).

sc-49 no longer present. Result: `create` → sc-54; `move` sc-54 → In
Progress; `update` sc-54's description.

(Run B was still not against the fully-documented baseline — the
sc-17 comment from Run A remained, and the Run A conversation-memory
of the workspace could not be fully purged. The canonical run below
starts from the reset baseline.)

### Findings from the pilots (leads, n=1)

**(a) Type-vs-name trap surfaced.** Run A chore 1: assistant reported
"You have 3 stories in progress in Shortcut" and included sc-23. sc-23
is in state **"In Review"** — its state has `type: "started"`, the
same type as "In Progress". The model collapsed both started-typed
states into the prose "in progress". Matches the pre-registered trap
in `docs/specs/shortcut-handmade.md`. **Golden-task candidate for
Phase 1.**

**(b) Tool-call counts (naive vs curated, n=1 each).**

| Chore | Naive | Curated |
|-------|-------|---------|
| 1 (what am I working on) | 2 | 1 |
| 2 (team board) | 3 | 1 |
| 3 (open Slack story) | 2 | 2 |
| 4 (comment on sc-17) | 1 | 1 |
| 5 (create — Run B, partial-clean course) | 5 | 1 |
| 6 (move) | 1 | 1 |
| 7 (update) | 1 | 1 |

Call composition unknown — the Claude Code UI collapses to "Called
shortcut-naive N times (ctrl+o to expand)". A **hand-exam limitation**
the Phase 1 harness removes by recording every call.

**(c) Invented relationships from raw pass-through.** Run A chore 1
reported sc-23 as a "sub-story of 17" — reconstructed from raw
`story_links` + `epic_id` fields the curated `compactStory` trims. Not
a parent-child relationship in the API model.

**(d) Naive surfaced information curated drops — spec gap.** Run A
chore 3: sc-22's `Highest` priority, `Backend`/`API`/`Integrations`
labels, and epic-16 linkage all shown by the raw pass-through. Curated
`compactStory`/`fullStory` trim these; the curated spec did not
include a priority/labels/epic dimension. Real workflow signal.
**Spec gap** — Phase 1 gate decision whether to expand curated or
accept the trim.

**(e) Duplicate detection through 143 raw tools worked well**
(supplementary). Assistant reconstructed the "does this already
exist?" check unprompted before creating sc-49-again. n=1,
supplementary.

**(f) Run B: all three writes correct.** Create landed sc-54 with the
right fields; move and update landed cleanly. **Coordination cost,
not capability** — both lanes can do the job on a clean course; naive
uses more calls to arrive at the same state.

**(g) Grader note — task-name casing differed between lanes.** Naive
Run B: `Reproduce, Fix, Verify`. Curated exam: `reproduce, fix,
verify`. Same user phrasing. **Phase 1 graders need a declared casing
tolerance** for free-text fields.

**Timing.** "Cogitated / Worked / Sautéed / …" markers appear only in
naive transcripts. No comparable timing captured curated-side. **Not
comparable across lanes** in this report.

### Environment notes (from pilots)

- Both lanes needed the identical clarifier `"in shortcut"` on chore 1.
- Claude Code produced `※ recap:` interludes and "worked-for-N-seconds"
  status lines. Host UI features, not part of the toolset comparison.
- The Phase 1 runtime (bare loop) has neither memory recall nor these
  UI features — every attempt is amnesiac and every call is recorded.

## Documented baseline

Verified 2026-08-08 against the live Shortcut API after full reset. The
canonical run below begins from this state.

Reset actions performed:

- **sc-54** (from pilot Run B): `DELETE /stories/54` → HTTP 204;
  subsequent `GET /stories/54` → HTTP 404. Confirmed removed.
- **Comments on sc-17**: two comments (ids 48 and 53, both "found the
  cause, it's the cache." from the two pilots) deleted via
  `DELETE /stories/17/comments/{id}` → HTTP 204 each. Shortcut soft-
  deletes comments: they remain in the story's `comments` array with
  `deleted: true`, but the **active** comment count on sc-17 is now
  **0**. See the API-behaviour note below.
- **Story titled "Fix login timeout"**: none exists. Verified via
  `GET /search/stories?query=title:"Fix login timeout"` → `total: 0`.

Board contents after reset — 10 stories, verified via
`GET /search/stories?query=team:walid-hls-team`:

| id | title | state | story_type | epic |
|----|-------|-------|------------|------|
| 17 | Get Started with Shortcut | In Progress | feature | 16 |
| 18 | Break work down in the Shortcut Way | To Do | chore | 16 |
| 19 | Automate with GitHub or GitLab | Done | chore | 16 |
| 20 | Customize for your Team | To Do | chore | 16 |
| 21 | Share Progress with the Roadmap | To Do | chore | 16 |
| 22 | Connect in Slack | To Do | chore | 16 |
| 23 | Accelerate your team with Agents | In Review | chore | 16 |
| 24 | Invite your team | To Do | chore | 16 |
| 25 | What's next? | To Do | chore | 16 |
| 30 | Connect in Slack | Backlog | feature | — |

Stories 17–25 sit under epic 16 ("Get Started with Shortcut" onboarding
epic). sc-30 has no epic — it is the accidental-duplicate Slack story
first flagged in Run A chore 3.

**API-behaviour note (worth remembering for Phase 1 graders):**
Shortcut's DELETE on `/stories/{id}/comments/{id}` returns HTTP 204 but
keeps the comment object in the story's `comments` array with
`{"deleted": true}`. Consumers that count comments naively will see the
old count; consumers that filter on `deleted == false` see the correct
count. The curated hand-built server's `StoryCommentSchema` does not
model the `deleted` field — it should for correctness.

## Part 2 — Canonical run

**Raw transcript:** [`raw/naive-run-canonical.txt`](raw/naive-run-canonical.txt).
**Recovered tool-call sequence:** [`raw/naive-canonical-toolcalls.txt`](raw/naive-canonical-toolcalls.txt).
**Cross-lane recovered sequence:** [`raw/handbuilt-toolcalls.txt`](raw/handbuilt-toolcalls.txt).

### Rig

Clean course per the Documented baseline above. Fresh Claude Code
session, `~/agentworks-exam/` as working directory,
`claude --strict-mcp-config --mcp-config <path>` from that empty
folder. `/mcp` confirmed one server connected: `shortcut-naive`. Seven
chores, original phrasing, `"in shortcut"` clarifier reused at chore 1
— **third session running** where this clarifier was needed.

### Capture note

The original terminal capture rendered chores 1–4 three times via the
verbose-display toggle; the archived raw file at
[`raw/naive-run-canonical.txt`](raw/naive-run-canonical.txt) contains
each chore once. Deduplication was performed by the reviewer holding
the original capture and disclosed in that file's header. The team-board
box-drawing table was also transcribed into labeled columns as noted in
the same header. Content otherwise verbatim. Chores 5–7 appear in
detailed mode with MCP payloads visible; those payloads are captured
verbatim and cross-verified against the recovered session log.

### Driver

**`claude-opus-4-7`** — recovered from Claude Code's session log at
`~/.claude/projects/-Users-admin-agentworks-exam/fb158c1e-cbaa-4fdf-abf8-9a397d1d2f28.jsonl`.

**Curated-exam driver asymmetry closed.** The curated run's driver was
not captured at exam time. Under the same recovery method
(session log `180a0fe5-8d30-4868-af6b-d268337aaac7.jsonl`), it is also
`claude-opus-4-7`. **Both lanes drove the same model.** Phase 1 pins
drivers explicitly.

### Findings (leads, n=1)

**(a) Type-vs-name trap reproduced.** Chore 1: assistant reported "You
have 4 open stories owned by you" and grouped sc-23 under "Started (in
progress)". sc-23 is in workflow state **In Review** — a state whose
`type` is `started`, the same type as In Progress. **Second naive
session, second occurrence** of this failure mode. Same session's
chore 2 placed every story in its correct state column, so the
failure tracks the *"what am I working on"* phrasing, not the
toolset's state ignorance — the same driver, given the same
information, produces one interpretation for a narrative-summary chore
and another for a board-layout chore. **Confirmed golden-task
candidate for Phase 1.**

**(b) Invented hierarchy reproduced and expanded.**

- Chore 1: sc-23 called "subtask of #17" (not a subtask — linked via
  "relates to").
- Chore 1: sc-22 called "subtask of #17". sc-22 has
  `parent_story_id: 17`, which in Shortcut's model is a different
  relationship than the `sub_task_story_ids` array — the two
  concepts got collapsed.
- Chore 2: #17 called "parent" and its checklist items called
  "subtasks"; on Story #17 those 8 items are `tasks` (checklist
  entries), not sub-stories. Two distinct data-model concepts
  merged by the raw-pass-through view.
- Chore 3: "parent story #17" repeated.

The naive lane's raw Story pass-through exposes enough fields
(`epic_id`, `parent_story_id`, `story_links`, `tasks`,
`sub_task_story_ids`) that the model reconstructs a hierarchy on top
of them that doesn't match Shortcut's own model.

**(c) Writes clean; assumptions matched the curated driver.** From
[`raw/naive-canonical-toolcalls.txt`](raw/naive-canonical-toolcalls.txt):

- `createStory({name:"Fix login timeout", story_type:"bug", group_id:"…", owner_ids:["…"], workflow_state_id:500000007, deadline:"2026-08-15T04:00:00Z", tasks:[Reproduce/Fix/Verify]})` — **correct default state id** (500000007 = To Do), correct owner id, tasks inline. Story sc-59 created.
- `updateStory(59, {workflow_state_id:500000008})` — **correct In Progress id**.
- `updateStory(59, {description:"happens only on Safari, cache-related"})`.

The model's flagged-aloud assumptions — `story_type: bug` inferred from
"Fix …" phrasing; "Friday" resolved to 2026-08-14 — match the same
inferences the curated exam's driver made (curated `create_story`
sent `story_type:"bug"` and `due_date:"2026-08-14T00:00:00Z"`). Same
driver, same model choices: **driver judgment, not toolset**.

**(d) Call counts (recovered, per chore).** From the two toolcalls
files, exact sequences:

| Chore | Naive canonical | Curated |
|-------|-----------------|---------|
| 1 (what am I working on) | 3 (`getCurrentMemberInfo`, `searchStories owner:walidhl state:started`, `searchStories owner:walidhl !is:done`) | 1 (`list_my_stories({})`) |
| 2 (team board) | 3 (`getGroup`, `listGroupStories limit:1000`, `listWorkflows`) | 1 (`list_team_stories({team:"Walid Hl's Team"})`) |
| 3 (open Slack story) | 1 (`getStory(22)`) | 2 (`get_story(22)`, `get_story(30)`) |
| 4 (comment on sc-17) | 1 (`createStoryComment`) | 1 (`comment_on_story`) |
| 5 (create) | 1 (`createStory` inline tasks) | 1 (`create_story` inline tasks) |
| 6 (move) | 1 (`updateStory` workflow_state_id) | 1 (`move_story`) |
| 7 (update description) | 1 (`updateStory` description) | 1 (`update_story`) |
| **Totals** | **11** | **8** |

Chore 3 shows the naive session at **1 call** and the curated session
at **2**. The naive model relied on chore 2's earlier
`listGroupStories` for sc-30's fields — **session-context reuse**.
Curated fetched both stories fresh. **Per-chore independence requires
Phase 1 isolation**; without it, later chores' call counts are
entangled with what earlier chores retrieved. The pilot report's
Part 1 finding (b) used approximate counts from the Claude Code UI's
collapsed "Called shortcut-naive N times" summaries; the recovered
sequences here supersede them.

**(e) Grader notes.**

- **Task-name casing:** naive sent `["Reproduce","Fix","Verify"]`;
  curated sent `["reproduce","fix","verify"]`. User phrasing was
  lowercase. Same driver, different casing decisions — model drift,
  not toolset. Graders need a **declared casing tolerance** for
  free-text fields.
- **Date vs datetime deadlines:** naive sent
  `deadline: "2026-08-15T04:00:00Z"` (04:00 UTC = midnight EDT on
  08-15 = end-of-Friday-08-14 in EDT); curated sent
  `due_date: "2026-08-14T00:00:00Z"` (midnight UTC on 08-14, which is
  20:00 EDT on Thursday 08-13). Both are "Friday" by intent but
  represent different instants and would render differently in the
  Shortcut UI. Graders scoring "due Friday" must tolerate a window;
  the golden-task phrasing itself should pin a timezone.

### Recovery note

Session logs under `~/.claude/projects/-Users-admin-agentworks-exam/`
were the recovery path for both per-chore call sequences and driver
model. Read-only extraction: no logs were modified. Both sessions
identified with confidence by their first-user-message + tool-server
pattern; timestamps in the recovered log for chores 5–7 match the
detailed-mode "01:15 AM claude-opus-4-7" / "01:16 AM claude-opus-4-7"
lines in the raw transcript, cross-verifying the mapping.
