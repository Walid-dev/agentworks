# Benchmark Report #2 — Cross-Family Companion (Terra)

**Cross-family replication of Report #1.** Same suite, same graders,
same lanes, different driver. Report is the numbers. Leads are labeled
as leads.

## Method

- **Lanes**: `shortcut-handbuilt` (curated 10-tool) and
  `shortcut-naive` (converter-generated 143-tool). Identical to
  Report #1's lanes; no server changes between reports.
- **Grid**: 20 tasks × 2 lanes × 3 reps = 120 attempts. Every cell
  hit n=3.
- **Driver**: `gpt-5.6-terra` (Responses API, `/v1/responses`),
  reasoning effort `medium` pinned in the request, recorded in every
  gpt-* transcript's `meta.start` for auditability. See
  `docs/decisions.md` 2026-08-18 for the cross-family reasoning-mode
  disclosure. Runtime C (`d46a403` + `44f3b68` bridge, migrated to
  Responses API in commit that landed pre-sweep).
- **Isolation**: id-first teardown (see the sc-570 story below).
  Sweep executed with `--pace-ms 1500` — the proven setting from a
  clean 120-attempt dry-run after the id-first fix landed. Baseline
  check workspace-wide on entry; capture-before-delete + direct-GET
  verify on every id created during the attempt; belt-and-braces
  search sweep + baseline re-verify post.
- **Grader**: `docs/specs/graders.md` unchanged. Every live fetch on
  the grading path is now retried through `withFetchRetry` (commit
  `842028f`) and every Shortcut HTTP call routes through the shared
  `shortcutFetch` client with 429/Retry-After awareness (commit
  `b248e84`).
- **Provenance & instrument story**: this sweep was executed once,
  resumed after the sc-570 cascade filled the 35 refused slots. The
  first execution produced 85 graded attempts and then 35 cascading
  refuseds when `sc-570` slipped past the search-based teardown due
  to Shortcut's search-index lag (Report #1's L7, fired at scale).
  Teardown was rewritten id-first (commit `3ea768d`) with a pinning
  test for the exact failure mode; sc-570 was cleaned up with
  receipts; the sweep resumed the 35 missing slots. All 120
  canonical attempts in this report land inside that one sweep
  directory (`runs/2026-08-18T21-33-07-215Z/`). Zero cost incurred
  on the 35 refuseds — the fail-safe worked as designed.
- **Cost**: **$1.42** for the 120-attempt sweep (first execution
  $0.95 + resume $0.47). Combined with the earlier Terra bridge
  ($0.30, 24 attempts) the total Terra spend across Report #2's
  full instrumentation is **~$1.72**, well under the $4.50 stop-line
  for the resume and the $9 stop-line originally set for the bridge.

## Validity — one task excluded, one annotated

**`state-backlog-implicit` is excluded from the headline**, same
ruling as Report #1 (see `docs/decisions.md` 2026-08-15). Prompt is
genuinely ambiguous. Report #1's Sonnet curated 3/3 asked for
clarification; Terra never asks (see F5). Both drivers exonerated
on this task by different mechanisms; task queued for rework. The
headline is computed on **19 tasks / 114 attempts** (57 per lane).

**`triage-highest-priority` passes are mechanism-divergent, annotated
but retained.** Both lanes pass 3/3 in this sweep, but by different
paths:
- **Naive**: reads `custom_fields.priority = "Highest"` off the target
  story — genuine priority receipt. Prompt supplied enough hint via
  fixture title alignment (renamed to "Q3 backlog spike" in commit 1
  of this cycle), so the fixture-title leak of the pre-fix bridge is
  closed and this pass is real.
- **Curated**: cannot see the priority field (`get_story` trims
  `custom_fields`). Passes by outlier-inference — the fixture is the
  only chore in state "To Do" that isn't part of the sc-17–25
  onboarding pattern. Curated is answering "which story is the outlier"
  and getting the right id for the wrong reason. Same class of
  inference recovery as F2 in Report #1 (info-epic-writeback); this
  is a task-design flaw, not a curated capability signal.

A two-fixture redesign is queued (add a distractor chore that
matches the outlier profile but has non-Highest priority) so the
curated lane must actually consult the priority field. Retained in
the headline for now with the mechanism divergence disclosed.
Queued as a follow-up fix.

## Headline

| lane | pass | fail | pass rate | mixed cells |
|---|---|---|---|---|
| shortcut-handbuilt | 44 | 13 | **77%** | 1 (dup-near, 2p/1f) |
| shortcut-naive | **50** | 7 | **88%** | 1 (state-name-vs-type, 2p/1f) |

The naive lane leads by **11 percentage points** on the headline —
**inverting Report #1** (Sonnet: curated 79% vs naive 68%).

The inversion is not uniform across tasks; it lives in specific cells:

**Naive cells that moved 0/3 → 3/3 under Terra vs Sonnet**:
- `create-with-pinned-deadline` (Sonnet 0/3 → Terra 3/3): Terra sends
  `group_id` on the create; Sonnet-naive had left it null across all
  three reps.
- `hierarchy-tasks-vs-stories` (Sonnet 0/3 → Terra 3/3): Terra
  consistently calls the tasks endpoint under the story; Sonnet-naive
  had picked a wrong hierarchy path.

**Naive cells that moved partial-fail → 3/3 under Terra**:
- `orient-team-write` (Sonnet 2p/1f → Terra 3/3).
- `orient-whoami-write` (Sonnet 1p/2f → Terra 3/3).

Combined, four naive cells added +9 passes over the Sonnet baseline —
enough to flip the headline before any curated changes are counted.

**Curated cells that regressed vs Sonnet**:
- `state-done-explicit` (Sonnet 3/3 → Terra 0/3): server payload
  defect exposed, see F2.
- `dup-near-detect` (Sonnet 3/3 → Terra 2/3): one rep-1 fail on a
  cell whose other two reps pass. Search-breadth variance; the
  question the agent asked in rep 1 was narrower than the fixture's
  near-dup phrasing. Called out at F6.

Curated lost 4 passes across those two cells; naive gained 9. Net
headline swing: +13 for naive. Cross-family divergence lives in the
tool surface × driver interaction, not in aggregate model strength.

## Four-axis token table (headline)

For clarity, this table uses the FULL 60-attempt lane counts (headline
excluded task's contribution is ~5% of totals; not enough to change
the multipliers materially).

```
                     input_tokens   output_tokens  cache_creation  cache_read
curated (60)         61,078         15,795         60,535          295,935
naive (60)           307,859        15,499         307,298         4,894,300
combined             368,937        31,294         367,833         5,190,235
```

**Multipliers (naive ÷ curated)**:
- Uncached input tokens: **5.04×**
- Cache-read tokens: **16.54×**
- Output tokens (reasoning-inclusive): **0.98×** (essentially even)
- Reasoning tokens (curated 7,273 vs naive 4,652): curated does
  **~1.56×** more reasoning per attempt, mirroring Report #1's
  info-vs-cost inversion pattern (curated compensates for less-exposed
  info with more reasoning).

**Cost per lane** (public gpt-5-family rates: input $1.25/M, cached
$0.125/M, output $10/M):
- Curated: **$0.271** ($0.00452/attempt)
- Naive: **$1.152** ($0.01919/attempt)
- **Dollar-cost ratio: 4.25×** at Terra pricing. Same order as
  Sonnet's 4.24× on Report #1 despite Terra's much cheaper
  cache-read rate — the naive lane's token-surface multiplier eats
  the per-token discount.

## Dual-prediction resolution

Reading the 2026-08-08 registered predictions ledger (W and Advisor,
`docs/decisions.md`).

**W's prediction**: success gaps shrink on stronger drivers.
**Result**: CONFIRMED on the success axis, INVERTED not just shrunk.
- Sonnet: curated 79% vs naive 68% (curated leads by 11 pp).
- Terra: curated 77% vs naive 88% (naive leads by 11 pp).
- The success gap didn't shrink — it flipped sign with the same
  magnitude. Naive under a stronger reasoning driver actually beats
  curated on this suite.

**Advisor's prediction**: cost gap holds; trap class is a
tool-surface property, not a driver property.
**Result**: HOLDS on both axes.
- **Cost**: the 4.25× dollar-cost gap replicates within 0.01× of
  Sonnet's 4.24× despite Terra's different pricing structure. Cost
  is a tool-surface property.
- **Trap class**: the implicit state trap (`state-trap-implicit`)
  fires on the naive lane across every driver observed. Lifetime
  count 14/14 across three families — Opus Phase 0 hand-exam (1/1),
  Sonnet pilot 2 (3/3), Sonnet Report #1 sweep (3/3), Terra bridge
  (3/3), Terra this sweep (3/3). See F1 for the exact breakdown.

**The finding**: which lane wins depends on the driver tier. Success
favors naive under strong reasoning drivers (they can navigate the
143-tool surface); cost favors curated everywhere at ~4× per
attempt; the trap class fires 14/14 lifetime on naive across three
model families regardless of driver strength. Different axes tell
different stories, and each story is real.

## Findings

Each finding names its n and quotes the transcript. Leads named as
leads.

### F1 — Implicit state trap: 14/14 lifetime on naive; explicit-task type-query slip on Terra (1/3)

Task: `state-trap-implicit` (softened phrasing "stories I'm currently
working on"). Answer key: `equals_state "In Progress"` = `{17}`.

**Naive lifetime tally across three families**:
- Opus, Phase 0 hand-exam Run A chore 1 (2026-08-07,
  `naive-first-run.md` §Findings-from-the-pilots item (a), n=1):
  1/1 fail. Assistant reported "3 stories in progress" and grouped
  sc-23 (In Review, `type: "started"`) under that label — the first
  documented occurrence of the type-vs-name collapse.
- Opus, Phase 0 canonical run chore 1 (2026-08-08,
  `naive-first-run.md` §Part 2 Findings item (a), n=1): 1/1 fail.
  Assistant reported "4 open stories" and grouped sc-23 under
  "Started (in progress)". Same driver, same failure mode, second
  session — confirmed the trap as a golden-task candidate for
  Phase 1.
- Sonnet (pilot 2 sweep `runs/2026-08-12T13-31-52-323Z`, n=3): 3/3.
- Sonnet (Report #1 sweep `runs/2026-08-14T13-52-01-885Z`, n=3): 3/3.
- Terra (bridge `runs/2026-08-18T13-58-01-966Z`, n=3): 3/3.
- Terra (this sweep `runs/2026-08-18T21-33-07-215Z`, n=3): 3/3.
- **Total: 14/14 across three families** on the naive lane
  (Opus 2/2 + Sonnet 6/6 + Terra 6/6).

Same failure mechanism every time: the query drops from state-name to
state-type. Representative Terra call (this sweep, rep 3):

```
queryStories({"requestBody":{"workflow_state_types":["started"], ...}})
```

Response returns both id 17 (state name "In Progress", type "started")
and id 23 (state name "In Review", type "started"). Driver reports
`"17, 23"`.

Curated across the same 14 attempts: 14/14 pass. The lane exposes
`list_my_stories({state: "In Progress"})` — a name filter, no type
route available.

**New under Terra: the trap fires on the EXPLICIT task too, 1/3.**
On `state-name-vs-type` (prompt names the column explicitly: "the
In Progress column"), Terra-naive rep 3 still went for
`workflow_state_types: ["started"]` and returned "17, 23".
Reps 1 and 2 on the same cell used the name filter correctly.
The type-query slip isn't tied to softened phrasing — it's a
driver's tool-choice preference on the naive lane's 143-tool surface.

### F2 — Curated server payload defect on filtered lists; driver-family-divergent responses

Task: `state-done-explicit`. Curated 0/3 on Terra, 3/3 on Sonnet.

**Server bug**: the curated server's `list_team_stories` and
`list_my_stories` return contradictory payloads when filtered by
`state`. Meta counters (`total`, `returned`) reflect the un-filtered
count; the actual array reflects the filtered count.

Terra rep 3 (`2026-08-19T13-39-24`), raw tool_result of
`list_team_stories({team:"Walid Hl's Team", state:"Done"})`:

```json
{"stories_by_state":{"Done":[
    {"id":19,"title":"Automate with GitHub or GitLab",
     "state":"Done","team":"Walid Hl's Team",
     "due_date":null,
     "url":"https://app.shortcut.com/agentworks/story/19"}
]},"total":10,"returned":10,"truncated":false}
```

One story in `stories_by_state.Done`; `returned:10` in meta.
Contradictory. Driver's final answer:

```
10, 11, 12, 13, 14, 15, 16, 17, 18, 19
```

Fabricated range: driver reconciled the 1-vs-10 discrepancy by
guessing the "missing" 9 ids were 10-18. Zero of those exist as
Done stories.

Terra reps 1 and 2 used `list_my_stories({state:"Done"})` and got
`{stories_by_state:{}, total:4, returned:4, truncated:false}` —
empty array, `returned:4` in meta. Same class of contradiction.
Driver went silent on both: turn 3 emitted no content and no tool
call, transcript ended without an answer.

**Sonnet on the same server, same call path, 3/3 pass**:
- `list_team_stories({team:"walid-hls-team", state:"Done"})` — all
  three reps.
- Final answer: `19` (rep 1: `Just one story is in the **Done**
  column: **19**`).

Sonnet trusted the array and ignored the meta contradiction. Terra's
reasoning-medium reconciled the contradiction by fabrication (rep 3)
or by silence (reps 1-2). Same server bug, family-divergent driver
response.

Lead: fix the curated filtered-list payload so meta counters reflect
the filtered slice, not the un-filtered slice. Queued.

### F3 — Outlier-inference class flaw in find-the-fixture tasks

Class of task: prompt asks the agent to identify a fixture based on a
property the tool surface may or may not expose, but the fixture is
also the only "outlier" story in the workspace on multiple unrelated
dimensions.

Members observed:
- `info-epic-writeback` (Report #1 F2): curated cannot see `epic_id`
  but sc-30 is the only story that's Backlog, empty-description,
  duplicate-title, no-story-links, no-tasks. Curated passes by
  identifying the outlier, not by reading epic_id.
- `triage-highest-priority` (this report): curated cannot see
  `custom_fields.priority` but the fixture is the only chore not in
  the sc-17–25 onboarding cluster. Curated passes by identifying the
  outlier, not by reading priority.

Both look like curated capability signals from lane rollups. Neither
is. The tasks rewrite the same wrong story twice, at scale. Task-
design defect, not a curated-capability finding.

Lead: add distractor fixtures that match the outlier profile on the
irrelevant dimensions but differ on the tested dimension. Queued as
"two-fixture redesign" for triage; equivalent redesign needed for
info-epic-writeback.

### F4 — Dup-write-guard 0/12 across two paid families

Task: `dup-write-guard`. Fixture pre-created with the exact title the
prompt asks the agent to create.

- Sonnet (Report #1 sweep, `runs/2026-08-14T13-52-01-885Z`): 0/6
  (curated 3 fail, naive 3 fail).
- Terra (this sweep, `runs/2026-08-18T21-33-07-215Z`): 0/6
  (curated 3 fail, naive 3 fail).
- **Total paid: 12/12 fail across two families, both lanes.**
- Opus was not paid-tested on this task (the Phase 0 hand-exam
  didn't include `dup-write-guard`; §6 of `handbuilt-vs-naive.md`
  noted duplicate-detection readiness only ancillary, not as a
  scored dimension).

Representative Terra curated rep 3 tool sequence:
```
whoami() → list_workspace_vocabulary() → create_story({title: "Deploy hotfix ..."})
```
Zero pre-write dup checks. Zero calls to `list_team_stories` or
`searchStories` to see if the title already exists.

Duplicate-awareness at these driver tiers requires either a
prompt-level scaffold ("check first, then create") or a tool-shape
that makes the check the natural first step. Report #1's L4 already
labeled this as prompt-scaffold-vs-tool-shape; Terra confirms the
finding replicates across families. Cross-family, driver-independent
so far — a third family would strengthen the claim from "two families"
to the ecosystem-scale reading.

### F5 — Clarify-reflex is fully absent under Terra (0/9 vs Sonnet 9/9)

Task: `triage-highest-priority` (originally). Also `state-backlog-
implicit`.

- Sonnet curated on ambiguous prompts: **9/9 clarified** across the
  triage prompt (n=3), the state-backlog prompt (n=3), and the
  pre-fix pilot (n=3).
- Terra curated on the same prompts: **0/9 clarified.** Terra
  produced an answer every time — sometimes right (triage: passed
  by outlier inference, F3), sometimes wrong (state-backlog:
  answered with a set instead of asking which reading).

The clarify-reflex Report #1 F4 labeled as a "required-parameter law"
is a Sonnet-family behavior, not a benchmark property. Confirmed by
Terra's counter-example at n=9. Report #1's F4 read should be
narrowed accordingly.

### F6 — Curated dup-near-detect: rep-1 search-breadth variance

Task: `dup-near-detect`. Curated 2/3 (one fail on rep 1).

The failing rep used a narrower search than the passing two — the
agent's `list_team_stories` didn't surface the near-dup because it
queried the wrong state. The two passing reps searched more broadly
or used a name-search route.

Not a systemic finding at n=3; noted for future re-runs.

## Fix queue

Server frozen as-examined per Phase 0 precedent — no changes to the
curated or naive server between Reports #1 and #2. Fixes land after
Report #2:

1. **Curated filtered-list payload (F2)**: `list_team_stories`,
   `list_my_stories` — meta counters (`total`, `returned`,
   `truncated`) must reflect the filtered slice, not the un-filtered
   count. Regression risk on tasks that read from those endpoints.
2. **Triage two-fixture redesign (F3)**: add a distractor chore with
   the outlier profile but non-Highest priority so the curated lane
   must consult `custom_fields.priority`. Same redesign class for
   `info-epic-writeback`.
3. **state-backlog-implicit rework**: authoring pass to resolve the
   narrow-vs-broad ambiguity — either lock the broad reading
   ("still ahead of us" = To Do + Backlog) or reword.

## Limitations

- **n=3 per cell.** Same as Report #1. Enough to see zero-mixed vs
  mixed patterns on strong signals; not enough for finer variance.
- **One workspace.** Shortcut only, one team, ten baseline stories.
  Generalization to other targets is Phase 3.
- **Reasoning-mode confound.** Runtime A (Sonnet) has no
  reasoning knob; Runtime C (Terra) ships with reasoning on and this
  sweep pinned effort medium (API default). Family and reasoning
  mode vary together across the cross-family comparison — inherent
  to cross-family replication, not a confound to eliminate. See
  `docs/decisions.md` 2026-08-18.
- **Task lineage.** Same as Report #1: task suite descends from
  Phase 0 exams that used the curated toolset first. Curated-
  direction bias probable; disclosed.
- **Server payload defect (F2)** exposed a difference in driver
  robustness to inconsistent tool responses. Sonnet trusts arrays;
  Terra reconciles meta counters by fabrication. Whether this is a
  fair benchmark of "the server" vs "the driver" is a task-design
  question — the server bug was present under Sonnet too, but
  Sonnet's read pattern was insensitive to it.

## Leads

Registered without verdict.

- **L1 — Success gap is driver-tier-dependent.** Sonnet: curated
  leads. Terra: naive leads. Same suite, same graders, opposite
  headline. Prospective replication candidate: run this sweep on
  a Terra sibling that ships with reasoning-effort low, or on Opus
  4.1, to size the "reasoning tier" contribution vs "model family"
  contribution.
- **L2 — Cost gap is driver-tier-INdependent.** 4.24× (Sonnet) vs
  4.25× (Terra). The naive lane's 143-tool prompt-surface dominates
  cost across pricing structures. Cost is a tool-surface property.
- **L3 — Trap class is universal at this tier.** 14/14 on
  `state-trap-implicit` naive across Opus, Sonnet, Terra. The trap
  lives in what the toolset exposes (state-type but not state-name),
  not in the model family. Driver strength is not sufficient to
  route around a type-only query surface.
- **L4 — Contradictory tool responses break Terra more than
  Sonnet.** F2's server bug turned into 0/3 fail on Terra but 3/3
  pass on Sonnet. Family-divergent robustness to malformed responses
  is a first-class Terra characteristic worth naming in the driver
  budget document.
- **L5 — Clarify-reflex belongs to Sonnet, not to the benchmark.**
  Report #1 F4's "required-parameter law" is a Sonnet-family behavior
  at n=9; Terra's 0/9 replaces the design law reading with a
  driver-behavior reading. Update F4's framing on the next Report #1
  amendment cycle.
- **L6 — Outlier-inference tasks are a task-design class flaw**,
  not a lane signal. Two tasks affected (`info-epic-writeback`,
  `triage-highest-priority`); two-fixture redesign queued for both.
- **L7 — Retired: fired at scale (sc-570) and now fixed by id-first
  teardown.** Report #1 called this lead prospective; Report #2
  turns it into a closed history entry with the fix commit
  (`3ea768d`) and the pinning test.

## Evidence in the tree

- Sweep transcripts: `runs/2026-08-18T21-33-07-215Z/` (120 canonical
  paid attempts, plus 35 refuseds and 12 dry-run stragglers inside
  the same sweep dir — the report-script filter keeps only the
  first 3 graded per cell).
- Bridge transcripts (24-attempt pilot, cost $0.30):
  `runs/2026-08-14T13-52-01-885Z/` was Report #1's sweep;
  `runs/2026-08-18T13-58-01-966Z/` was the Terra bridge that
  surfaced two defects, each fixed in a distinct commit: the grader
  fetch flake and the triage-fixture-title leak were both closed
  in `842028f` (`fix(harness): grader fetch retries and triage
  fixture rename`); the info-priority-writeback fixture was
  neutralized prospectively in `4af9a7d` (`fix(tasks): neutralize
  answer-telegraphing fixture titles`).
- Instrument state at report time:
  - Runtime C (OpenAI Responses API, reasoning medium pinned):
    `d46a403` (initial) + Responses migration commit landed pre-sweep.
  - Grader fetch retries + triage fixture rename: `842028f`.
  - Rate-limit robustness (shortcutFetch + --pace-ms + always-meta.end):
    `b248e84`.
  - Info-priority-writeback fixture neutralization: `4af9a7d`.
  - Id-first teardown (L7 fix): `3ea768d`.
- `docs/decisions.md` entries dated 2026-08-18: Terra bridge readings
  banked; Responses-API driver deployment disclosure; L7 fired at
  scale.
