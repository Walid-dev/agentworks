# Handbuilt vs. naive — Phase 0 comparison

Phase 0 produces leads and instrument requirements; verdicts belong to
the Examiner. Every claim below is cited to primary evidence in the
repo (exam reports, raw transcripts, recovered toolcalls). Sample sizes
are marked; nothing here is a conclusion.

Primary sources:

- `docs/reports/handbuilt-first-run.md` (curated exam, 2026-08-07)
- `docs/reports/naive-first-run.md` (naive pilots + canonical, 2026-08-07/08)
- `docs/reports/raw/naive-run-a.txt`, `raw/naive-run-b.txt`, `raw/naive-run-canonical.txt`
- `docs/reports/raw/handbuilt-toolcalls.txt`, `raw/naive-canonical-toolcalls.txt` (recovered from `~/.claude/projects/`)
- `docs/specs/shortcut-handmade.md` (curated spec)
- `docs/decisions.md` (baseline provenance, converter selection)

## 1. Two toolsets in numbers

**Curated: 10 tools.** From `docs/specs/shortcut-handmade.md`:
`whoami`, `list_workspace_vocabulary`, `list_my_stories`,
`list_team_stories`, `find_stories`, `get_story`, `create_story`,
`move_story`, `comment_on_story`, `update_story`. Design philosophy
from the spec's Intent: *"a small toolset shaped around the chores
actually done in a normal week of Shortcut use, not around the API's
endpoint list. Each tool covers a whole chore an assistant can be
asked for in one sentence."* **Chore-shaped.**

**Naive: 143 tools.** From `servers/naive/src/index.ts`
(`toolDefinitionMap` count), generated from the 85 paths of Shortcut's
public OpenAPI spec (`docs/specs/shortcut-openapi.json`, retrieved
2026-08-07 from `developer.shortcut.com/api/rest/v3/shortcut.openapi.json`).
Generator: `openapi-mcp-generator@4.0.1` invoked with only `--input`
and `--output` — no filtering, per
`docs/reports/naive-converter-survey.md` and the decisions.md entry of
2026-08-07. **Endpoint-shaped**: one tool per HTTP verb per path.

Ratio: **14.3× more tools in the naive lane** (143 / 10).

## 2. Same driver, same course

**Driver: `claude-opus-4-7` in both lanes.** Recovered from Claude
Code's session logs at `~/.claude/projects/-Users-admin-agentworks-exam/`
(read-only extraction, documented in `raw/handbuilt-toolcalls.txt` and
`raw/naive-canonical-toolcalls.txt`). The driver was not pinned by
protocol at exam time; sameness observed, not enforced. See §7 for the
Phase 1 requirement this creates.

**Course:** two naive pilots (Run A 2026-08-07 late evening, Run B
2026-08-08 early morning) ran on a **contaminated course** — sc-49 from
the curated exam was still present. Pilots are disclosed in
`naive-first-run.md` Part 1 and treated as leads-only. The
**Documented baseline** was then verified 2026-08-08 against the live
API (stories 17–25 under epic 16, sc-30 outside epic, 0 active comments
on any story, no story named "Fix login timeout"); the **canonical
naive run** on 2026-08-08 (05:09–05:19 UTC) started from that state.
The curated exam of 2026-08-07 ran on an earlier, similarly clean state
(no post-exam stories, no post-exam comments) per its own report.

## 3. Chore-by-chore ledger

Curated tool-call sequence from `raw/handbuilt-toolcalls.txt`; naive
tool-call sequence from `raw/naive-canonical-toolcalls.txt`. Both are
verbatim from the recovered session logs.

| # | Exact phrasing | Curated (calls) | Naive canonical (calls) | Outcome each side | Note |
|---|----------------|-----------------|--------------------------|-------------------|------|
| 1 | "What am I working on?" + "in shortcut" | 1 — `list_my_stories({})` | 3 — `getCurrentMemberInfo({})`, `searchStories({query:"owner:walidhl state:started"})`, `searchStories({query:"owner:walidhl !is:done"})` | Both listed stories; naive's first `searchStories` uses the `state:<type>` operator — see §4a | The `state:started` operator returned both In Progress and In Review; the misgrouping was encoded in the query |
| 2 | "Show me the team's board." | 1 — `list_team_stories({team:"Walid Hl's Team"})` | 3 — `getGroup(...)`, `listGroupStories({limit:1000})`, `listWorkflows({})` | Both produced a state-grouped board | Naive fetches team, stories, and workflows separately |
| 3 | "Open the Slack story and tell me where it stands." | 2 — `get_story({id:22})`, `get_story({id:30})` | 1 — `getStory({story-public-id:22})` | Both identified the duplicate; curated pulled both, naive reused chore-2's list | Session-context reuse (see §7) |
| 4 | "Add a comment on story 17: found the cause, it's the cache." | 1 — `comment_on_story({id:17, text:"…"})` | 1 — `createStoryComment({story-public-id:17, requestBody:{text:"…"}})` | Comment posted both sides | Parity |
| 5 | "Create a story called Fix login timeout … Due Friday" | 1 — `create_story({title:"Fix login timeout", team:"Walid Hl's Team", story_type:"bug", tasks:["reproduce","fix","verify"], due_date:"2026-08-14T00:00:00Z"})` → **sc-49** | 1 — `createStory({requestBody:{name:"Fix login timeout", story_type:"bug", group_id:"…", owner_ids:["…"], workflow_state_id:500000007, deadline:"2026-08-15T04:00:00Z", tasks:[{description:"Reproduce"},{description:"Fix"},{description:"Verify"}]})` → **sc-59** | Story created both sides | Parity in call count; content diverges — see §5b and §8 grader notes |
| 6 | "Move that story to in progress." | 1 — `move_story({id:49, state:"In Progress"})` | 1 — `updateStory({story-public-id:59, requestBody:{workflow_state_id:500000008}})` | Moved to In Progress both sides | Curated tool takes a state name; naive requires the numeric id |
| 7 | "Update its description with: happens only on Safari, cache-related" | 1 — `update_story({id:49, description:"…"})` | 1 — `updateStory({story-public-id:59, requestBody:{description:"…"}})` | Description updated both sides | Parity |
| **Total mcp calls** | | **8** | **11** | | Ratio 1.38× |

Auxiliary calls (Read, Bash, ToolSearch) are in the raw files but not
counted here; both sessions used them for the same purposes (memory
lookup, workspace listing, deferred-tool schema fetches).

## 4. Findings for the curated lane

**(a) Type-vs-name "in progress" trap: the naive lane's query surface
routed the driver into the trap; the curated contract made
name-grouping the only available path.** Lead — 2/2 naive sessions vs
0/2 curated sessions. Mechanism located at query construction, not
narration.

- **Recovered evidence, naive canonical**
  (`raw/naive-canonical-toolcalls.txt`, chore 1): the driver's first
  content call was
  `searchStories({query:"owner:walidhl state:started", detail:"slim"})`.
  Shortcut's `state:` operator accepts both state **names** and
  **type** values; a name query returns only that named state
  (verified by probe on 2026-08-08: `state:"In Progress"` returned
  `[(59, 500000008), (17, 500000008)]` — only In Progress stories,
  no In Review). The recovered chore-1 query used the type value
  `started`, which matches In Progress and In Review alike, so the
  query returned both. The model then narrated the returned set
  under the label *"Started (in progress): - #17 … - #23 …"*
  (`raw/naive-run-canonical.txt`). **The trap is the value the raw
  surface made available, not the operator's grammar: the raw
  surface offers the type value; the curated contract exposes no
  type path at all.**
- **Same session, chore 2** used different tools —
  `listGroupStories({limit:1000})` returns all team stories with
  their `workflow_state_id`s, no type-filter, and the model then
  labelled them by state name: *"In Review (1): #23 Accelerate your
  team with Agents"* (`raw/naive-run-canonical.txt`). Same session,
  same driver, chore 2 placed sc-23 correctly. **The failure is not
  toolset state ignorance and not narration; it is the choice of a
  type-filtered query in chore 1.**
- **Naive Run A pilot** (`raw/naive-run-a.txt` chore 1):
  *"You have 3 stories in progress in Shortcut … sc-49 … sc-17 …
  sc-23 — Accelerate your team with Agents (sub-story of 17)."*
  Same lane, same failure surface. Log-level tool call detail was
  not extracted for the pilot session; the query operator surface is
  identical to canonical.
- **Curated exam chore 1** (`docs/reports/handbuilt-first-run.md`):
  *"In Progress: #17 Get Started with Shortcut … In Review: #23 …"* —
  states correctly separated. Curated `list_my_stories`
  (`servers/shortcut-handbuilt/src/index.ts`) accepts a `state`
  parameter that is resolved through `resolveState` against
  `list_workspace_vocabulary` — a workflow-state **name**, not a type
  — and always groups the result via `groupByState`. **There is no
  `state:<type>` operator to reach.** Pre-registered in
  `docs/specs/shortcut-handmade.md`: *"State selection is by workflow
  state name (matched against the list from
  `list_workspace_vocabulary`), not by state type. 'In Progress'
  means the state literally named In Progress; the workflow has two
  states of type `started`, so filtering by type is wrong."*
- The curated tool contract removed the failure path. The naive
  lane's raw-query surface preserved it. **Confirmed golden-task
  candidate**, §8.

**(b) Invented hierarchy from raw fields.** Lead — 1 clean naive
session (canonical); consistent with pilot Run A; 0 curated sessions.

Naive canonical, three separate constructions in one session:

- Chore 1: *"sc-23 — Accelerate your team with Agents — subtask of #17"*;
  *"sc-22 Connect in Slack — chore, Backend/API, Highest priority,
  subtask of #17"*.
- Chore 2: *"#17 Get Started with Shortcut (parent · due 08-13)"*;
  *"Parent story #17 is due in 5 days (2026-08-13) with 6 of its 8
  subtasks still not started."*
- Chore 3: *"Epic: #16 (parent story #17 — Get Started with Shortcut,
  due 08-13)"*.

Shortcut's data model distinguishes: `tasks` (checklist items on a
Story); `sub_task_story_ids` (a list of separate stories that are
sub-stories); `parent_story_id` (single parent-story reference);
`story_links` (typed links, e.g. "relates to"); `epic_id` (epic
membership). The raw `Story` pass-through exposes all of these. The
model in the naive lane collapsed them into a single "parent/subtask"
narrative — the 8 items on sc-17 that were called "subtasks" are
`tasks` (checklist entries) per the API model.

Curated `get_story` (`raw/handbuilt-toolcalls.txt`,
`servers/shortcut-handbuilt/src/index.ts`) exposes `story_links` with
verb only, and does not surface `parent_story_id` /
`sub_task_story_ids` / `epic_id`. Curated chore-3 output on sc-22
(from `handbuilt-first-run.md`): *"chore, To Do, owner walidhl,
onboarding Slack-integration story, tasks
Investigation/Implementation/Review all incomplete, relates to #23, no
comments"* — no hierarchy invented, no misuse of parent/subtask.

**(c) Coordination cost on orientation chores.** Lead — 1 clean
session per lane.

From §3: chores 1–2 (orientation) show **1+1 curated vs 3+3 naive** —
naive uses **3× the calls** for the same orientation answer. Chores
4–7 (writes) are at parity (1 vs 1 each). Chore 3 shows curated 2 vs
naive 1, but the naive saving depends on chore-2's earlier read (see
§7 session-entanglement limitation).

## 5. Findings against the curated lane (equally prominent)

**(a) Information loss from trimming — priority, labels, epic linkage.**
Lead — 1 clean naive session; consistent with pilots.

- **Naive canonical chore 3** (`raw/naive-run-canonical.txt`) on sc-22:
  *"Type: Chore · Priority: Highest · Team: Backend / API /
  Integrations · Owner: You · Epic: #16 (parent story #17 — Get Started
  with Shortcut, due 08-13) · Related: #23 Accelerate your team with
  Agents (currently In Review)"*. The `Highest priority`,
  `Backend/API/Integrations` labels, and epic linkage came from the
  raw Story pass-through.
- **Curated get_story on sc-22** (from `handbuilt-first-run.md` chore
  3): *"chore, To Do, owner walidhl, onboarding Slack-integration
  story, tasks Investigation/Implementation/Review all incomplete,
  relates to #23, no comments"*. No priority. No labels. No epic.
- Source of the loss: `compactStory` / `fullStory` in
  `servers/shortcut-handbuilt/src/index.ts` return only
  `id, title, state, story_type, team, owners, requester, due_date,
  description, tasks, comments, story_links, url`. Priority, labels,
  `epic_id` are not exposed.
- The curated spec `docs/specs/shortcut-handmade.md` was scoped to
  "chores actually done in a normal week" and did not include priority
  / labels / epic. In this exam the naive user got a triage signal
  (*"Highest priority Backend/API sitting in To Do"*) that the curated
  user did not. **Spec gap** — Phase 1 gate decision whether to expand
  the curated dimension.

**(b) Same word, two instants: the abstraction shifted where the
timezone decision happened.** Lead — 1 clean session per lane.

Recovered payloads (verbatim from the two toolcalls files):

- **Curated** (`raw/handbuilt-toolcalls.txt`):
  `create_story({… "due_date":"2026-08-14T00:00:00Z"})`.
- **Naive** (`raw/naive-canonical-toolcalls.txt`):
  `createStory({… "deadline":"2026-08-15T04:00:00Z" …})`.

The two payloads encode instants **28 hours apart** for the same word
"Friday" from the same driver (`claude-opus-4-7`).

- Shortcut's UI renders deadlines as **date-only**. Probe on
  2026-08-08 (story #63, created with
  `deadline: "2026-08-14T00:00:00Z"`, then deleted): the Shortcut UI
  displayed it as *"due Aug 14, 2026"*. The current UI **masks the
  divergence**.
- Any **time-aware consumer** would surface it: scheduled reminders
  keyed to the timestamp, sort-by-deadline ordering within the same
  day, a viewer or workspace in a non-EDT timezone, an ICS export,
  an analytics window like "created this week", or a Phase 1 grader
  that compares timestamps directly.
- Where the decision happened is what differs. The curated tool's
  parameter is named `due_date` (surface: "date"); the underlying
  API field is `deadline` (a timestamp). The abstraction called it a
  date, and the driver — with no timezone cue in the parameter —
  sent midnight-UTC of the target day. The naive tool exposed
  `deadline` directly with no simplification, and the same driver
  chose end-of-day-EDT converted to UTC. **The curated abstraction
  removed the timezone decision from the driver's surface without
  pinning a default** (e.g. workspace timezone at 23:59:59). The
  naive lane kept the decision in the driver's surface and it landed
  end-of-EDT.

Phase 1 grader implication in §8 — window tolerance + phrase-level
timezone pinning.

## 6. Supplementary — duplicate detection through 143 raw tools

n=1 pilot only (contaminated course), documented in
`naive-first-run.md` Part 1 finding (e). Naive Run A chore 5
(`raw/naive-run-a.txt`): *"Heads up — sc-49 'Fix login timeout'
already exists on your team's board … This is an exact match — sc-49
already has: Name / Team / Owner / Tasks / Due / Status /
Description … Creating a new one would be a duplicate. Do you want me
to: 1. Skip … or 2. Create a second story anyway …?"* The driver
reconstructed a "does this already exist?" check unprompted using the
naive lane's raw tools. Curated had no chance to demonstrate the
equivalent — sc-49 did not exist during the curated exam.

**Not comparable across lanes** (curated never saw a duplicate to
detect); logged here because the naive lane produced this behavior at
all and Phase 1 should probe it deliberately.

## 7. Limitations, unflinching

- **Sample sizes.** n=1 canonical curated + n=1 canonical naive.
  Two additional naive pilots superseded. Every finding here is a
  **lead**, not a measurement.
- **Chores authored from the curated spec.** The seven exam chores are
  the "Done when" list of `docs/specs/shortcut-handmade.md`. That is
  anchoring by construction — the curated lane's scope defined the
  test surface. Phase 1 must diversify golden tasks beyond curated's
  originating list.
- **Session entanglement of call counts.** Chore-3 naive used 1 call
  because chore-2's `listGroupStories` had already retrieved sc-30's
  fields. Per-chore counts here are **not independent measurements**.
  Phase 1 harness must isolate per chore or grade sequences explicitly.
- **Driver sameness by default, not by pin.** `claude-opus-4-7`
  happened to be the driver both sides; nothing pinned it. Phase 1
  pins drivers at attempt time.
- **Curated lane provenance.** Per `docs/decisions.md` (2026-08-07):
  *"Hand-built baseline provenance: human-specified from real workflow
  (docs/specs/shortcut-handmade.md), AI-implemented under iterative
  expert review with live-API verification. Reports and the Phase 4
  essay describe this lane as the 'curated' baseline, never as purely
  human-authored; the shared-model-family overlap with the Designer is
  disclosed as a limitation."*
- **API-behavior wrinkles that are not part of this comparison.**
  Shortcut soft-deletes comments (curated schema does not model
  `deleted`); `workflow_state_id` is required on POST /stories;
  `Workflow.default_state_id` is a first-class field the curated lane
  uses (learned mid-Phase-0, per decisions.md 2026-08-07 and commit
  `8dab14f`). These are noted here so they are not silently mistaken
  for lane-comparison signal.
- **Claude Code product features are not part of the toolset.**
  Memory recall, "recap" interludes, workspace-directory listings, and
  other Claude Code UX features were present in all hand exams and
  are absent from the Phase 1 runtime (bare loop in
  `packages/agent`). Findings that ride on these features — including
  any observation that the driver "reached for memory first" — may
  not transfer unchanged to Phase 1.

## 8. What Phase 1 must measure

**Golden-task candidates surfaced by these exams:**

- **Type-vs-name state trap** (§4a): does the toolset let the driver
  distinguish workflow state **name** from state **type**? Multiple
  variants — narrative summaries ("what am I working on") and board
  layouts ("show me the board") — the two phrasings produced
  different outcomes in the same naive session.
- **Duplicate-check readiness** (§6): does the toolset support "does
  this already exist?" workflows before creates? Requires a duplicate
  to exist at exam start; can be scripted.
- **Orientation vs. writes split** (§4c, §3): chores 1–2
  discriminated by 3× call count; chores 4–7 at parity. Golden-task
  suite must include both classes.
- **Information-loss vs. coordination-cost trade-off** (§4c vs §5a):
  build tasks that reward exposing priority/labels/epic (favors
  naive-style breadth) and tasks that penalize call count (favors
  curated-style bundling). Measure the ratio, not each in isolation.
- **Invented-hierarchy susceptibility** (§4b): probe with fixtures that
  have `parent_story_id`, `sub_task_story_ids`, `story_links`, and
  `epic_id` set orthogonally; grade against the true model.

**Grader tolerances required:**

- **Casing** (§5b context; §3 chore-5): user says "reproduce, fix,
  verify"; curated payload was `["reproduce","fix","verify"]`; naive
  payload was `["Reproduce","Fix","Verify"]`. Same driver, different
  cases. Graders on free-text fields need a **declared casing
  tolerance**, or the golden-task phrasing pins case.
- **Date vs datetime** (§5b): "Friday" resolved to different instants
  (Thursday-evening-EDT vs end-of-Friday-EDT) from the same driver
  depending on the field abstraction. Graders need a **window
  tolerance** (e.g., any timestamp within the target date in the
  driver's clock timezone) and the phrasing itself should **pin a
  timezone** unless testing that behavior specifically.

**Isolation and driver-pinning requirements:**

- **Per-chore isolation:** the Phase 1 runtime must offer a
  fresh-session mode so call counts do not entangle across chores
  (§7 session-entanglement).
- **Pin driver at attempt time.** Not "the model that happened to be
  loaded" but a declared model id recorded with every attempt (§7
  driver-sameness).
- **Pin the clock or accept timezone-relative dates in phrasing.**
  §5b showed "Friday-on-Friday" is ambiguous across timezones.
- **Record every tool call with input, output, and timestamp.** The
  bare loop from `packages/agent` already does this; the Phase 1
  harness must preserve it. The recovered
  `~/.claude/projects/` session logs were the only reason chore-level
  call counts here are exact rather than approximate; the Phase 1
  harness must not depend on host-side recovery.
