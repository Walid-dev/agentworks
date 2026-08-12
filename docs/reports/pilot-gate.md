# PLAN.md 1.8 — pilot review and format lock

**Gate closed 2026-08-12.** Two pilot sweeps against the two local
lanes (`shortcut-handbuilt`, `shortcut-naive`), driver
`claude-sonnet-4-6`, caching off (comparability with pilot 1). The
gate reads the second sweep as the primary result; pilot 1 is retained
here as the instrument-diagnosis record.

## Sweeps

| sweep | tasks × lanes × reps | attempts | grade counts (from bench.sqlite) | notes |
|---|---|---|---|---|
| `2026-08-11T21-17-39-312Z` (pilot 1) | 3 × 2 × 3 | 18 | 8 pass, 9 fail, 1 grade-pass with teardown_error (was reported as "ungraded" pre-fix) | tri­age answer key was non-unique; sweep-level bookkeeping eclipsed a pass on a Shortcut 500 teardown crash; teamless artifacts left uncounted |
| `2026-08-12T13-31-52-323Z` (pilot 2, re-pilot after 1.8 fixes) | 4 × 2 × 3 | 24 | 15 pass, 9 fail, 0 ungraded, 0 refused, 0 teardown errors | primary gate evidence |

Between pilots, the harness was hardened in one commit (see
`docs/decisions.md` 2026-08-11 "Pilot 1 findings") — scope moved from
team-scoped to workspace-wide, `grade_status` and `teardown_status`
split, workspace cleaned to a documented baseline
(`docs/reports/baseline-2026-08-11.md`), triage fixture placed on the
team, and a new companion task `state-trap-implicit` restored the
softened phrasing.

## Registered predictions and outcomes

Each pilot task carries a hypothesis in its `notes:` block. The
scoreboard from pilot 2:

| # | task | prediction | pilot-2 outcome | verdict |
|---|---|---|---|---|
| 1 | `create-with-pinned-deadline` | curated wins on timezone-pinned writes (handbuilt-vs-naive §5b — "Friday" produced instants 28h apart across lanes) | curated 3/3 pass, naive 3/3 fail — every naive create landed with `group_id: null`, and the grader now correctly names `team: expected "Walid Hl's Team", story has none` | **confirmed** |
| 2 | `state-name-vs-type` (explicit prompt) | curated matches the state name directly, naive risks the type filter (handbuilt-vs-naive §4a, hand-exam 2/2) | curated 3/3, naive 3/3 — the trap does NOT fire when the prompt names the column explicitly | **confirmed the null**: the mechanism is prompt-phrasing-sensitive, not lane-intrinsic |
| 3 | `state-trap-implicit` (softened prompt) | trap fires on naive at the query level when "working on" is not a column name | curated 3/3 pass, naive 0/3 pass — every naive attempt returned `17, 23` (sc-23 is in "In Review", also a `started`-type state); the trap fired 3/3 | **confirmed and exceeded**: hand-exam saw 2/2, pilot 2 saw 3/3 with three distinct query strategies converging on the same wrong answer set |
| 4 | `triage-highest-priority` (info-vs-cost, §5a) | naive wins on information breadth; curated trims priority away and cannot resolve | naive 3/3 pass, curated 0/3 pass **but for a different reason** (see below) | **confirmed on outcome, unexpected on mechanism** |

4/4 predictions confirmed on the aggregate outcomes. Prediction 3's
"exceeded" note is not the score — it's that the mechanism replicated
across three different naive query paths in a single sweep (see
Findings), strengthening the causal read.

## Final table (with `grade_status` and `teardown_status`)

Pilot 2, 24 attempts, all teardowns clean:

```
task_id                      lane_id             grade_status  teardown_status  n
---------------------------  ------------------  ------------  ---------------  -
create-with-pinned-deadline  shortcut-handbuilt  pass          ok               3
create-with-pinned-deadline  shortcut-naive      fail          ok               3
state-name-vs-type           shortcut-handbuilt  pass          ok               3
state-name-vs-type           shortcut-naive      pass          ok               3
state-trap-implicit          shortcut-handbuilt  pass          ok               3
state-trap-implicit          shortcut-naive      fail          ok               3
triage-highest-priority      shortcut-handbuilt  fail          ok               3
triage-highest-priority      shortcut-naive      pass          ok               3
```

`sweep.end`: `passed=15 failed=9 ungraded=0 refused=0`. No
teardown-error rows this time (contrast: pilot 1 had one).

## Audited findings — quotes from the transcripts

### F1 — Three distinct type-paths converge on the same wrong answer

`state-trap-implicit` on `shortcut-naive`, all three reps of pilot 2.
The naive lane tried three different query shapes; each returned
`{17, 23}` — including sc-23, "In Review" (a `started`-type state
that isn't literally "In Progress"). Answer key is `{17}`.

- Attempt `2026-08-12T13-32-38-650Z.jsonl`:
  `searchStories({"query": "owner:walidhl is:started"})` → answer `17, 23`
- Attempt `2026-08-12T13-33-43-275Z.jsonl`:
  `queryStories({"requestBody": {"owner_id": "6a74c42b-...", "workflow_state_types": ["started"]}})` → answer `17, 23`
- Attempt `2026-08-12T13-34-48-137Z.jsonl`:
  `searchStories({"query": "owner:walidhl state:started"})` → answer `17, 23`

Three separate strategies (query-language `is:started`, tool-schema
`workflow_state_types:["started"]`, query-language `state:started`)
all reduce "the stories I'm currently working on" to the `started`
type, and all miss because the workflow has two `started`-type
states. The naive toolset offers the type-first path via multiple
surfaces; the agent uses one, then another, then another, without
falling back to the state-name distinction.

Curated on the same task, same reps: `list_my_stories` returns
stories grouped by workflow-state NAME. All three curated attempts
answered `17`.

### F2 — Within-sweep phrasing contrast (same lane, same driver)

`shortcut-naive` grade_status by task, pilot 2:

- `state-name-vs-type` ("Which stories are in the **In Progress**
  column right now?"): **3/3 pass**
- `state-trap-implicit` ("Reply with just the story ids of the stories
  I'm **currently working on**, comma-separated"): **0/3 pass**

Same lane, same driver, same sweep. The difference is prompt
phrasing: naming the column directly bypasses the type filter path;
softening the phrasing surfaces it. The trap is a query-level
behavior, not a lane-intrinsic failure.

### F3 — Curated triage clarify-reflex at n=6, required-parameter mechanism

`triage-highest-priority` on `shortcut-handbuilt`, six attempts
across both pilots. All six called **zero tools** and returned a
clarifying question.

Quoted answers (all six):
- pilot 1 × 3: `"I need to know which team you're referring to. Could you please specify the team name?"`
- pilot 2 × 2: `"I need to know which team you're referring to. Could you please specify the team name?"`
- pilot 2 × 1: `"Which team's board should I check?"`

Mechanism: the curated toolset makes `team` a **required parameter**
on the list/search paths (`list_team_stories(team, state?)`,
`find_stories(query)` doesn't help for a priority-filtered read).
The prompt says "the team's board" without naming it. The agent
refuses to guess the required argument and asks — even though the
workspace has exactly one team and `list_workspace_vocabulary` would
have surfaced it.

This is the **first measured input to Phase 2's Designer**: a
required parameter with no listable-defaults path is a design
choice that produces zero tool calls when the prompt is ambiguous,
regardless of driver capability. The Designer's tool-shape decisions
land here.

### F4 — Honest triage nuance: curated never reached the designed priority wall

The information-vs-cost hypothesis (§5a) was that curated **trims
priority away entirely** and therefore cannot answer priority-based
triage. Pilot 2 shows curated 0/3 pass — **but the failure happens
one step earlier**: the agent clarified `team:` and never called a
tool, so the trimmed-priority tool shape was never exercised. The
priority-trimming design remains untested by this pilot; the
clarify-reflex hides it. To measure the designed priority wall, a
future task would need to declare the team in the prompt so the
agent proceeds to the list-and-filter step.

## Cost accounting (transcripts' usage fields)

sonnet-4-6 pricing: ~$3/M input, ~$15/M output. Caching off.

| sweep | attempts | input tokens | output tokens | cost |
|---|---|---|---|---|
| pilot 1 (`2026-08-11T21-17-39-312Z`) | 18 | 1,099,115 | 3,773 | **$3.35** |
| pilot 2 (`2026-08-12T13-31-52-323Z`) | 24 | 1,533,951 | 4,436 | **$4.67** |

Per-attempt gap between lanes stayed at the pilot-1 ratio: naive
runs at ~141K input tokens each (uncached tool-definition payload
for ~90 tools + a few tool_result echoes), curated at ~9K. That ~16×
gap is the primary Report #1 cost lever and the first argument for
the caching change scheduled before the 1.10 full sweep.

## Format lock

The golden-task format (`docs/specs/golden-task-format.md`) and the
harness (`docs/specs/harness.md`, `docs/specs/graders.md`) produced
the intended discrimination on all four §8 candidate classes present
in the pilot set:

- state-trap: pilot-2 lanes split 3-0/0-3 on `state-trap-implicit`
  (softened prompt catches the query-level trap); split 3-3 on
  `state-name-vs-type` (explicit prompt does not).
- write: pilot-2 lanes split 3-0 on `create-with-pinned-deadline`
  (grader now names team-missing as the specific failure, not
  "no story with matching title").
- info-vs-cost: pilot-2 lanes split 0-3 on `triage-highest-priority`
  (naive wins on information breadth; curated's clarify-reflex
  eclipses the designed priority wall — see F4).

Format is **locked** for the Phase 1 scale-up (PLAN.md 1.9). Two
formatting-level revisions were absorbed inside the 1.8 gate rather
than emerging as new items:

1. `setup[i].team` is a permitted field (from the 1.8 gate ruling on
   scope). Optional; when a fixture is meant to sit on a specific
   team's board, declare it here.
2. Task notes may reference incident records (as
   `pilot-info-vs-cost.yaml` now does). Not required.

## Leads carried into Phase 1.9 and Phase 2

Recorded here at the n of the pilot; leads, not conclusions.

- **L1 — Query-level type-vs-name split** (n=3/3 naive on
  `state-trap-implicit`; see F1). Candidate for elaboration in the
  1.9 task set: more phrasings, more states with overlapping types
  (backlog/unstarted vs unstarted, in progress/in review under
  started).
- **L2 — Required-parameter clarify-reflex** (n=6 curated on
  `triage-highest-priority`; see F3). First measured design lesson
  for the Designer: a tool that requires an unknown argument
  produces zero tool calls regardless of driver. Phase 2 design
  choice.
- **L3 — Naive tool-payload cost dominates** (~141K input tokens per
  attempt, uncached). Caching lands as its own change before 1.10.
- **L4 — Priority-trimming remains untested end-to-end** (n=6
  curated triage never reached the priority step; see F4). If a
  future task pins the team, the trimmed-priority failure becomes
  observable.

## Evidence in the tree

- Pilot 2 transcripts: `runs/2026-08-12T13-31-52-323Z/` (24 JSONL
  files across four tasks × two lanes × three reps, plus
  `teardown-log.jsonl`), committed as canonical evidence for this
  gate. `bench.sqlite` stays out (derived, rebuildable via
  `bench sqlite rebuild <sweep-dir>`).
- Pilot 1 transcripts: `runs/2026-08-10T21-55-15-539Z/` (from the
  earlier 1.7 evidence commit) and `runs/2026-08-11T21-17-39-312Z/`
  (from the closing days of 1.7, retained through 1.8 for the
  eclipsed-pass rebuild proof).
- Baseline of the workspace: `docs/reports/baseline-2026-08-11.md`.
- Instrument fixes between pilots: commits `4e27119` (workspace-wide
  scoping, honest bookkeeping, pilot task repairs), `087242b`
  (`equals_state` workspace-wide), `e64f748` (grader resolves stories
  id-first, team as assertion). See `git log --oneline` between the
  two sweep stamps for the full chain.
