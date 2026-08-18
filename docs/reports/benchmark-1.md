# Benchmark Report #1 — Curated vs Naive

**PLAN.md 1.10.** Two-lane discrimination measured against the Phase 1
golden-task suite. The report is the numbers. Verdicts belong to
Phase 2 and later.

## Method

- **Lanes**: `shortcut-handbuilt` (curated), `shortcut-naive`
  (converter-generated from Shortcut's OpenAPI spec, openapi-mcp-generator
  4.0.1). See `docs/decisions.md` 2026-08-07 for the naive-baseline
  provenance. **Plain-words gloss for outside readers: curated = the
  hand-designed 10-tool server; naive = the converter-generated
  143-tool server.**
- **Grid**: 20 tasks × 2 lanes × 3 reps = 120 attempts. Every cell hit
  n=3 with no ungraded or refused rows in the canonical read.
- **Driver**: `claude-sonnet-4-6`, pinned per the 2026-08-12 driver
  budget ruling (`docs/decisions.md`). Anthropic prompt caching enabled
  (Runtime A, `feat(harness): enable prompt caching in runtime a`,
  commit `44f3b68`) — two ephemeral breakpoints per lane on the system
  prompt and the last tool definition.
- **Isolation**: per-attempt as described in `docs/specs/harness.md` —
  workspace-wide baseline check on entry, real fixture setup with
  `{{run}}` substitution, fresh MCP server per attempt, capture-
  before-destroy teardown with bounded retries (added in commit
  `b22194a` after a rung-2 transient Shortcut 500), workspace-wide
  baseline re-verify.
- **Grader**: `docs/specs/graders.md` — deterministic, id-first,
  workspace-wide resolution. Every fetch is a receipt in the grade
  record.
- **Provenance & instrument story**: commits `146d86b` (task suite),
  `4e27119` (workspace-wide scoping + bookkeeping split), `087242b`
  (equals_state workspace-wide), `e64f748` (id-first grader). The
  rung-2 sweep hit one transient Shortcut 500 during a teardown
  delete which left `sc-334` as a stray and correctly refused the
  remaining 17 attempts on the dirty course; the fail-safe worked
  as designed. The teardown retries + resume subcommand
  (`b22194a`) plus the dry-run-artifact detector fix (`58cc34f`)
  landed as free repairs; the paid resume filled the 17 slots at
  $0.79 to complete the grid.
- **Cost**: **$5.28** session total (rung 1 curated smoke $0.023,
  rung 1.5 naive smoke A cold $0.211, rung 1.5 naive smoke B warm
  $0.055, sweep $4.988). Well under the $14 stop-line, well under
  the $15 remaining-Anthropic cap.

## Validity — one task excluded

**`state-backlog-implicit` is excluded from the headline.** Prompt:
"Which stories on the team's board are still ahead of us?" Answer key
locked to state `"Backlog"` = `{sc-30}`. Both readings are defensible:

- Narrow (answer key): only stories in state `Backlog`.
- Broad (equally natural in English): any story not yet started
  (`To Do` + `Backlog` = 7 stories).

Naive agents returned the broad set on 3/3 attempts:
```
"30, 22, 18, 20, 21, 24, 25"
```

Curated agents asked for clarification on 3/3 (the required-parameter
reflex on "which team?" + the ambiguous "ahead of us"):
```
"I need to know which team you're referring to, and also what
 'ahead of us' means in context — could you clarify: ..."
```

Both lanes exonerated on this task. Queued for rework; the headline
is computed on **19 tasks / 114 attempts** (57 per lane).

## Headline

| lane | pass | fail | pass rate | mixed cells (grade) |
|---|---|---|---|---|
| shortcut-handbuilt | **45** | 12 | **79%** | 0 |
| shortcut-naive | **39** | 18 | **68%** | 2 |

- Curated: zero grade-status-mixed cells across all 19 tasks — every
  cell either 3-pass or 3-fail, no rep-to-rep variance in outcome.
- Naive: two grade-status-mixed cells (`orient-team-write` at 2p/1f,
  `orient-whoami-write` at 1p/2f). Reliability axis, not just accuracy.
- Per-attempt cached cost: curated $0.0159, naive $0.0676 — a **4.24×
  gap**, driven by the naive lane's 143-tool payload even under
  automatic-prefix caching's ~90% discount on the reused block.

## Four-axis token table (headline, 114 attempts)

```
                     input_tokens   output_tokens  cache_creation  cache_read
curated (57)         151,211        20,717         5,024           419,504
naive (57)           350,647        19,363         45,329          7,796,588
combined             501,858        40,080         50,353          8,216,092

cost breakdown (sonnet-4-6 pricing: $3/M in, $15/M out, $3.75/M write, $0.30/M read)
  input     @ $3.00/M :  $1.506
  output    @ $15.00/M:  $0.601
  cache_wr  @ $3.75/M :  $0.189
  cache_rd  @ $0.30/M :  $2.465
  HEADLINE TOTAL      :  $4.760
```

Full 120-attempt totals (including `state-backlog-implicit`):
`$4.988` (see `runs/2026-08-14T13-52-01-885Z/`).

## Findings

Each finding names its n and quotes at least one transcript. All leads
are labeled as leads.

### F1 — Implicit state trap fires 3/3 on naive, 0/3 on curated; three type-paths converge

Task: `state-trap-implicit` (softened phrasing — "stories I'm
currently working on"). Answer key: `equals_state "In Progress"` =
`{17}`.

- **Curated 3/3 pass** with `list_my_stories({state: "In Progress"})`
  — the toolset groups by workflow-state NAME, so the type filter
  never enters the picture.
- **Naive 3/3 fail** with three distinct type-path attempts across
  this sweep + pilots (n=6 total naive attempts on the same task):
  - `searchStories({"query":"owner:walidhl is:started"})` (pilot 2)
  - `queryStories({"requestBody":{"owner_id":"...","workflow_state_types":["started"]}})` (pilot 2 + this sweep)
  - `searchStories({"query":"owner:walidhl state:started"})` (pilot 2 + this sweep)

  All three query strategies reduce "working on" to the `started`
  workflow-state type, and all six return `{17, 23}` — sweeping
  `sc-23` "In Review" in because "In Review" is also a `started`-type
  state. Answer key expected `{17}` only.

The state trap is prompt-phrasing-sensitive at the query level: named
column (`state-name-vs-type`) does not fire; softened phrasing
(`state-trap-implicit`) fires 3/3 on naive across two independent
sweeps.

### F2 — Trimmed-info recovery by inference: curated matches naive on info-vs-cost, pays a 2.8× tool-call premium

Task: `info-epic-writeback`. Answer requires stating which team story
is not under an epic (`sc-30`).

Curated's `get_story` **trims** `epic_id`. The pilot-gate.md F4
conjecture: curated cannot answer.

Actual: **curated 3/3 pass, naive 3/3 pass.** Curated recovered by
inference from the outlier profile of `sc-30`. From baseline-2026-08-11.md
and the curated agent's ten `get_story` calls (one per team story),
`sc-30`'s distinguishing features vs the sc-17–25 onboarding cluster
are visible without needing `epic_id` directly: `Backlog` state (the
only story there), empty description, duplicate title (the second
"Connect in Slack" — sc-22 has the same title), no story_links, no
tasks. Every other team story shares the onboarding-epic pattern.
The write-back description correctly names `sc-30`.

- Curated: **14 tool calls per attempt** (whoami + list_workspace_vocabulary
  + list_team_stories + 10 × get_story + create_story) — the ten
  `get_story` calls are the inference path, one per team story to
  pull description / story_links / tasks and spot the outlier.
- Naive: **5 tool calls per attempt** (getCurrentMemberInfo +
  listWorkflows + listGroups + queryStories + createStory) — the single
  `queryStories` retrieves `epic_id` inline for the whole team.

Ratio: **2.8× tool-call premium** for curated to reach the same
outcome. This is the info-vs-cost ratio Report #1 was chartered to
measure. Info-vs-cost is a cost RATIO, not a capability wall.

### F3 — Proactive duplicate checking absent at this tier regardless of toolset

Task: `dup-write-guard`. Fixture pre-created a story with the exact
title the prompt asked the agent to create.

**Curated 3/3 fail, naive 3/3 fail — 0/6 both lanes.** Every attempt
created a duplicate without checking. Representative quote from
`runs/2026-08-14T13-52-01-885Z/dup-write-guard/shortcut-handbuilt/2026-08-14T14-09-37-390Z.jsonl`:

```
final_answer: "Your story is live! Here's a summary of what was created:
- Title: Deploy hotfix 2026-08-14T14-09-37-390Z
- URL: https://app.shortcut.com/agentworks/story/308"
```

`sc-307` (the pre-existing fixture) is on the board; the agent created
`sc-308` and reported it as success. The `answer_ids: equals_fixture
"existing"` grade check caught it — expected `{307}`, got `{308}` in
the extracted id set. On that same rep, `workspace_unchanged`
**false-passed** because Shortcut's search-index propagation lag hid
`sc-308` from the post-attempt snapshot (see L7); the `answer_ids`
check carried the verdict.

Duplicate-awareness at this driver tier requires prompt-level scaffold
(explicit "check first") — neither toolset triggers a check-then-write
pattern implicitly. Lead: candidate for the Designer at Phase 2 to
surface a `find_stories_by_title` primitive on the create path.

### F4 — Required-parameter law, both edges with receipts

**Reads edge — clarify-reflex at n=9/9.** Task:
`triage-highest-priority` ("One story on the team's board is marked
Highest priority. Reply with just its story id.") The curated tool
`list_team_stories` requires a `team` argument. The prompt says "the
team's board" without naming which. Curated agents refuse to guess:

```
"I need to know which team you're referring to. Could you please
 specify the team name?"
```

Zero tool calls in every curated attempt. Nine of nine across pilot 1
(3), pilot 2 (3), and this sweep (3). Naive agents (with `queryStories`
and no required-team filter) answer 3/3 correctly in this sweep.

**Writes edge — writes succeed at 6/6 vs variance.** Tasks
`orient-team-write` and `orient-whoami-write` ("Create a story...
on my team's board / for my team, assigned to me..." — team required,
not named). Curated agents call `list_workspace_vocabulary` first,
learn there is exactly one team, and proceed to create with the
correct `group_id`. **Curated 6/6 pass across the two tasks × 3 reps.**
Naive shows variance: **orient-team-write** 2 pass / 1 fail;
**orient-whoami-write** 1 pass / 2 fail. Naive attempts that failed
either sent a null `group_id` (the sc-334-shape bug) or missed the
owner-is-self resolution.

Asymmetry: a read can refuse ("I need to know…"); a write must produce
some outcome, so the required-parameter reflex forces orientation
before the create. This is a task-design lesson for the Designer at
Phase 2.

### F5 — Grader lead: markdown numbers harvested as ids

The `answer_ids` extraction regex `(?:sc-)?(\d+)` matches any digit
sequence in the answer text. Example from
`dup-write-guard / curated / 2026-08-14T14-09-37`:

```
answer: "...Type: Chore\n- Team: Walid Hl's Team\n- State: To Do\n
         - Owner & Requester: You (@walidhl)\n- Due Date: September 15,
         2026 at 11:59 PM Toronto time (EDT)\n- URL:
         https://app.shortcut.com/agentworks/story/308"
got: [8, 9, 11, 14, 15, 37, 59, 308, 390, 2026]
```

**Audit (2026-08-15 gate).** Across the sweep, 15 `answer_ids`
checks had extracted numbers beyond the expected set. Nine were
straightforward genuine fails (an expected id was missing from the
extracted set). The remaining six were cases where `expected ⊆ got`
plus extra ids — the shape where extraction noise could in principle
flip a correct answer to fail. Each was inspected:

- Three `state-backlog-implicit` naive fails: agent's semantic answer
  was the broad reading (`{18,20,21,22,24,25,30}` and similar) —
  legitimate wrong answers under the narrow key, not noise. Task
  excluded from headline; no verdict at stake.
- Two `state-trap-implicit` naive fails: agent literally said `"17,
  23"` — sc-23 is a real story id the agent picked as answer.
  Extraction faithful; the trap did fire (F1).
- One `state-backlog-implicit` naive fail with position numbers (12,
  32) mixed into the got set from a reasoning paragraph ("position
  ~32B"): even removing those extras, the set differs from `{30}` by
  seven real story ids. No flip.

**Zero verdicts in this report were flipped by extraction noise.**
The set-comparison catches wrong answers even when noise is present,
because expected sets are small and the agent's genuine wrong
answers include real ids the extractor can see. A stricter extraction
(sc-prefix required, or word-boundary rules) is queued for a follow-
up commit. Format-spec change may be required.

## Limitations

- **n=3 per cell.** Enough to see zero-mixed vs mixed patterns on
  strong signals; not enough for anything finer.
- **One driver.** claude-sonnet-4-6 only. Runtime C (OpenAI seat, per
  PLAN.md 1.9b) is code-ready; a Terra replication lane runs post-
  Report #1 per the driver ruling.
- **One workspace.** Shortcut only, one team, ten baseline stories.
  Generalization to other targets is Phase 3.
- **Task lineage.** The task suite descends from Phase 0 exams that
  used the curated toolset first. Task provenance line
  (`ai-drafted, human-reviewed`) is honest, but the curated lane is
  the ancestor of the phrasing choices — probable bias in curated's
  direction. Disclosed.
- **Task authoring is itself error-prone.** `state-backlog-implicit`
  landed as an ambiguous prompt with a locked-narrow answer key and
  had to be excluded on the gate read. One-in-twenty on this
  authoring pass; expect similar rates as the suite grows.
- **Cache TTL edge behavior.** During the original sweep, cache
  reuse held across ~103 attempts before rung-2's Shortcut-500
  transient interrupted the run. The paid resume ($0.79 for 17
  attempts) hit a fresh cold-cache write on both lanes.

## Leads

Registered without verdict.

- L1 — Query-level type-vs-name split (F1). Candidate for 1.9-follow
  task expansion: more softened-phrasing traps at different state
  pairs.
- L2 — Required-parameter law (F4). First measured design input to
  Phase 2's Designer: a required argument without a listable-defaults
  path produces clarify-reflex on reads, orientation-preamble on
  writes.
- L3 — Info-vs-cost is a ratio, not a wall (F2). The 2.8× curated
  tool-call premium on `info-epic-writeback` is the first data point;
  more info-vs-cost tasks would size the ratio's distribution.
- L4 — Proactive duplicate checking absent at this tier (F3). Not
  toolset-linked; both lanes miss. Prompt-scaffold vs tool-shape is
  the fork.
- L5 — Naive lane spawns a ~$0.068 cost floor per attempt. Dominates
  Report #1 spend; Report #2's design should either restrict naive
  attempts or accept the floor.
- L6 — Grader extraction fragility (F5). Audit confirms no verdicts
  affected. Fix queued.
- L7 — Search-index propagation lag can hide agent-created strays
  from the same-attempt teardown (specimen: sc-308 above). Bounded
  teardown retries partially address this; a stronger fix is to poll
  workspace-wide until the created id appears in the search index
  before snapshotting post-attempt.

## Evidence in the tree

- Sweep transcripts: `runs/2026-08-14T13-52-01-885Z/` (120 canonical
  paid attempts + 34 dry-run artifacts + teardown log), committed
  as canonical evidence. `bench.sqlite` is derived and stays out;
  rebuild with `bench sqlite rebuild runs/2026-08-14T13-52-01-885Z`.
- Session smokes: rung 1 + rung 1.5 transcripts under
  `runs/2026-08-14T13-32-05-487Z/`, `runs/2026-08-14T13-50-29-903Z/`,
  `runs/2026-08-14T13-50-46-233Z/`. Uncommitted (gitignored) —
  documented in this report.
- Instrument state at report time:
  - Runtime A caching: `44f3b68`.
  - Runtime C (OpenAI seat): `d46a403`.
  - Teardown retries + sweep resume: `b22194a`.
  - Resume dry-run-artifact detector fix: `58cc34f`.
