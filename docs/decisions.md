# Decision log

One line per decision: date — decision — why. Newest on top.

## Decided

- 2026-08-23 — Phase 2 gate: research done, direction open.
  Gate ledger: Door 2 (from-scratch designer) CLOSED — the
  driver-tier finding from Report #2 removed its premise (which
  toolset wins depends on the driver, so "design one toolset in
  advance" is the wrong shape). Door 1 (refiner) PARKED as candidate
  second product line; buyer hypothesis = platforms shipping
  auto-generated toolsets; steelman search pending. Door 3
  (websites — DOM lane + WebMCP lane) researched, NOT decided.
  Product-relevant market facts registered: WebMCP is real and
  shipping — Shopify enabled it on all Liquid storefronts on
  2026-08-05 (9 tools, no merchant opt-in), Cloudflare shipped a
  one-toggle developer preview 2026-08-06, Chrome-only today, spec
  still moving (pin a snapshot if built against). Paying market for
  agent audits exists (task-runner audits at ~£13 wholesale). No
  existing product compares interface lanes (DOM vs site tools) or
  driver tiers — the two empty axes we already know how to fill.
  Moat doctrine (candidate): accumulated public measurement data
  plus method reputation, not speed.
  Pricing rulings (owner, 2026-08-23): NO free live-agent runs —
  zero-cost-to-us until paid; free tier is static checks only; paid
  audits are flat-priced per configuration, quoted internally from
  measured token costs — NO customer-facing token markup
  (unpredictable bills, commodity-margin trap); subscription
  re-checks are the recurring spine (drivers, tools, browsers change
  monthly); registration fee rejected at launch (revisit as an abuse
  deposit on store-token audits if needed).
  Two-lane requirement AFFIRMED after the owner's WebMCP-only
  challenge: the comparison is the product; the G.1 spike (see
  PLAN.md) measures both lanes' economics; repetition-weighting is
  the budget knob, not lane deletion.
  Housekeeping on prior entries:
  (a) 2026-08-08 Pending "Phase 2 direction — refiner aggressiveness"
      now reads under Door-1-parked — the design axis is preserved
      for the second product line, not a Phase 2 default assumption.
  (b) 2026-08-08 Pending "Embeddings provider — Phase 2 gate (Voyage
      vs OpenAI)" is deferred — it presumed a Designer-shaped Phase
      2, which is no longer the assumed direction.
  (c) The 2026-08-19 phase-1-close wording "Phase 2 direction decided
      at the gate per the standing dual prediction, now resolved
      axis-split" is clarified: what resolved axis-split was the
      dual PREDICTION (W on success, Advisor on cost + trap class);
      the Phase 2 DIRECTION is not decided and is now the open gate
      recorded here.

- 2026-08-19 — Phase 1 closed. Exit criterion met: Benchmark Report
  #1 committed (and exceeded: cross-family companion #2). Phase 2
  direction decided at the gate per the standing dual prediction,
  now resolved axis-split.

- 2026-08-19 — Report #2 leads registered (L1-L7, cross-family
  companion). L1: success gap is driver-tier-dependent — Sonnet
  curated 79% vs naive 68%, Terra curated 77% vs naive 88% (opposite
  headline, same magnitude). L2: cost gap is driver-tier-INdependent
  — 4.24x (Sonnet) vs 4.25x (Terra); cost is a tool-surface
  property. L3: implicit state trap universal at this tier — 14/14
  on `state-trap-implicit` naive across Opus (2/2 Phase 0 hand-
  exam), Sonnet (6/6), Terra (6/6). L4: contradictory tool responses
  break Terra more than Sonnet — F2 curated server payload defect
  turned into 0/3 fail on Terra but 3/3 pass on Sonnet, worth naming
  as a Terra characteristic. L5: clarify-reflex belongs to Sonnet,
  not the benchmark — 9/9 Sonnet vs 0/9 Terra on ambiguous prompts;
  Report #1 F4's "required-parameter law" is a Sonnet-family
  behavior. L6: outlier-inference tasks are a task-design class
  flaw — info-epic-writeback and triage-highest-priority both pass
  on curated by outlier inference not by reading the trimmed field;
  two-fixture redesign queued. L7: retired — fired at scale
  (sc-570) and closed by id-first teardown (commit 3ea768d, pinning
  test lands the exact failure mode).

- 2026-08-19 — Report #2 dual-prediction resolution. W's 2026-08-08
  registered prediction (success gaps shrink on stronger drivers)
  CONFIRMED on the success axis — inverted, not just shrunk (11 pp
  swing, same magnitude, opposite sign). Advisor's side (cost gap
  holds; trap class is a tool-surface property) HOLDS on both axes:
  cost gap replicates within 0.01x across pricing structures, trap
  fires 14/14 lifetime on naive across three families. The finding:
  which lane wins depends on the driver tier. Success favors naive
  under strong reasoning drivers; cost favors curated everywhere at
  ~4x per attempt; trap class fires on the naive lane regardless of
  driver strength. Different axes tell different stories.

- 2026-08-18 — Report #1 lead L7 fired at full scale (sc-570):
  teardown's search-based stray detection missed an index-lagged
  story; 35 attempts correctly refused at zero cost. Teardown is
  now id-first from transcript receipts (fixtures + every id
  harvested from tool_result bodies via harvestStoryIds), each
  deletion verified by direct GET expecting 404 — direct id reads
  are not index-lagged. Search-based sweep demoted to belt-and-
  braces (with one bounded re-poll when a verified-absent id still
  appears in the snapshot, to absorb known index-lag). Test pins
  the exact failure mode: a fixture transcript with a created id
  that search cannot see must still get deleted and verified.

- 2026-08-18 — Terra bridge readings banked (4 pilots x 2 lanes x
  3 reps = 24 attempts, gpt-5.6-terra, Responses API, reasoning
  medium, cost ~$0.30). Findings, in order:
  (a) Implicit state trap now 11/11 on naive across Opus, Sonnet,
      and Terra: the trap lives in the tool surface (only
      `workflow_state_types` exposed, no name filter), not in the
      model family. Same failure mode reproduces across three
      independent drivers.
  (b) The clarify-reflex is DRIVER behavior, not a design law:
      Terra never asked a clarifying question on ambiguous prompts;
      Sonnet refused 9/9 on `state-backlog-implicit`. Whatever
      earlier notes framed as a benchmark property is a
      Sonnet-family behavior in disguise.
  (c) First cross-family divergence candidate: Terra fired the
      state-family trap ONCE on the CURATED lane
      (`state-trap-implicit` 2/3, not 3/3). Terra reasoned that
      state type "started" ⊃ "currently working on" and included
      In Review; the curated toolset exposed the disambiguation and
      the driver chose to conflate anyway. Sonnet's curated header
      had this task solid. Full sweep decides if it replicates.
  (d) Terra tool-path preference on naive: chose the type-only
      `queryStories` over the name-capable `searchStories` on
      `state-name-vs-type`, failing an explicit-name task once
      where Sonnet passed 3/3. First case of Terra bypassing a
      name-capable tool that was available on the same lane.
  (e) Fixture-title leak found and fixed: `triage-highest-priority`
      fixture titled "Priority probe" leaked the answer via keyword
      on every lane. Both bridge lanes 3/3 pass on this task were
      false positives (agents pick by title without touching any
      priority-bearing tool). Fixture renamed to "Q3 backlog spike";
      the task's notes record what was invalidated where.
      Report #1 verified leak-free via Sonnet naive's
      priority-receipts trail.
  (f) Grader fetch flake found and fixed: `state-name-vs-type`
      curated rep 1 came back ungraded because the /search/stories
      GET threw "fetch failed" mid-grade with no retry. Terra's
      answer was correct ("17"). Bounded retry (0/2/4/8s, logged
      receipts) now wraps every live fetch in the grading path via
      `withFetchRetry`; the previously-added
      `resolveByNameWithRetry` composes with it (index-poll on the
      outside, network-retry on each attempt).
  Bridge cells stand as validation data, not headline data.

- 2026-08-18 — Cross-family lane runs `gpt-5.6-terra` as deployed:
  Responses API (`/v1/responses`), reasoning effort `medium` (API
  default made explicit, pinned in the request), function tools flat.
  Runtime A (Anthropic Sonnet 4.6) has no reasoning knob; Runtime C
  (OpenAI Terra) is a reasoning model that ships with reasoning on.
  Family and reasoning mode therefore vary together across the
  cross-family bridge — inherent to cross-family replication, not a
  confound to eliminate; disclosed in the report. `reasoning_effort`
  is recorded in every gpt-* transcript's `meta.start` for
  auditability. Chat Completions was ruled out after two preflight
  rejections (`max_tokens` unsupported → `max_completion_tokens`;
  tools + reasoning unsupported on Chat Completions).

- 2026-08-15 — Report #1 gate ruling: `state-backlog-implicit`
  task EXCLUDED from the headline. Prompt "which stories are still
  ahead of us" is genuinely ambiguous — both the narrow reading
  (state = Backlog, {sc-30}) and the broad reading (state ∈ {To Do,
  Backlog}, 7 stories) are defensible in English. Answer key locks
  the narrow reading; both lanes exonerated on this task. Queued
  for rework; Report #1 headline computed on 19 tasks / 114 attempts.
- 2026-08-15 — Report #1 gate ruling: pilot-gate.md F4 conjecture
  overturned. Curated 3/3 correct on `info-epic-writeback` despite
  its `get_story` trimming `epic_id` — the agent inferred sc-30's
  epic-less status from the outlier profile visible without epic_id
  (Backlog state, empty description, duplicate title, no story
  links, no tasks) across ten get_story calls. Info-vs-cost is a
  cost RATIO, not a capability wall: curated matched naive on
  outcome at a 2.8× tool-call premium (14 vs 5 per attempt).
- 2026-08-15 — Report #1 gate ruling: required-parameter law
  confirmed both edges. Reads that require an unknown argument
  produce clarify-reflex — triage-highest-priority curated at 9/9
  across pilots 1+2 and this sweep, zero tool calls per attempt.
  Writes that require an unknown argument produce successful writes
  with orientation preambles — orient-team-write +
  orient-whoami-write curated at 6/6, naive at 4 pass / 2 fail
  across the same six attempts. Asymmetry root cause: a read can
  refuse ("I need to know…"); a write must produce some outcome,
  which forces orientation before the create.
- 2026-08-12 — Driver budget ruling (owner): Report #1's headline
  completes on claude-sonnet-4-6 as pinned, within a hard $15
  remaining-Anthropic cap. The 2026-08-10 opus second-tier pin is
  SUPERSEDED on cost: the second sweep runs on OpenAI
  (gpt-5.6-terra), serving as the cross-family replication lane.
  After Report #1, OpenAI is the default for all paid harness
  attempts; Anthropic drivers run only where a decision names them.
  All findings remain labeled with their driver.
- 2026-08-12 — Pilot gate closed (PLAN.md 1.8). Prediction scorecard
  from pilot 2 (sweep 2026-08-12T13-31-52-323Z, 4×2×3, driver
  claude-sonnet-4-6, caching off): 4/4 registered predictions
  confirmed on aggregate outcomes; the softened state-trap prediction
  exceeded on mechanism, replicating across three distinct
  naive query paths (is:started, workflow_state_types:["started"],
  state:started) that all reduced "working on" to the started type
  and returned {17, 23}. Full record in
  docs/reports/pilot-gate.md.
- 2026-08-12 — Phrasing-dependency result: within one sweep, one
  driver, one lane (shortcut-naive), state-name-vs-type (prompt
  names the column) passed 3/3 while state-trap-implicit (softened
  phrasing) failed 3/3. The state-vs-type trap is a query-level
  behavior induced by the prompt's phrasing, not a lane-intrinsic
  failure. Locks task-authoring guidance: state-trap phrasings must
  be explicitly categorized in 1.9 as named-column vs softened.
- 2026-08-12 — Required-parameter design lesson (first measured input
  to the Phase 2 Designer): a tool with a required argument the
  prompt doesn't supply produces zero tool calls at n=6 (curated
  triage across both pilots), regardless of driver capability. The
  Designer must either surface listable-defaults for required
  arguments, or make the argument optional with a lookup path, or
  the prompt-and-tool pair produces clarify-reflex instead of work.
- 2026-08-11 — Pilot 1 findings (sweep 2026-08-11T21-17-39-312Z):
  (a) triage-highest-priority's answer key was non-unique — sc-22 in
  the baseline carried Priority=Highest alongside the fixture; agents
  answering sc-22 were correct by the workspace, wrong by the grader;
  students exonerated. Fixed by baseline amendment
  (baseline-2026-08-11.md) removing the priority from sc-22 and by
  fixture setup now sitting explicitly on the team;
  (b) team-scope bug class instances 3 and 4 — snapshotIdSet and
  checkBaseline were both team-scoped, leaving ten teamless artifacts
  invisible to teardown and to baseline verification. Both now
  workspace-wide (fetchAllStories);
  (c) eclipsed-pass bookkeeping — sweep-level try/catch overwrote a
  completed grade with "ungraded" when teardown crashed on a Shortcut
  5xx. Split into grade_status and teardown_status; a teardown
  failure never overwrites a completed grade; meta.end is always
  written;
  (d) softened trap confirmed at the query level — state-name-vs-type
  didn't reproduce the hand-exam trigger because the prompt was
  explicit; the companion task state-trap-implicit restores the
  softened phrasing ("stories I'm currently working on") to catch
  naive lanes that resolve it via state:started rather than the
  literal In Progress state name;
  (e) measured 141K-vs-9K per-attempt input-token gap (uncached)
  between naive and curated lanes — the naive lane's ~90 tools
  balloon the tool-definition payload per turn. Cost implication
  registered for Report #1's budget.
- 2026-08-11 — Naive-lane finding: generated validation silently
  collapses to passthrough (eval SyntaxError swallowed); tools work
  only where the API tolerates unvalidated payloads. Generator output
  as shipped; receipts in the 1.8 diagnosis. Corrected framing: the
  earlier "createStory crashes" summary overstated it — creates
  succeed unvalidated. The real 1.7-sweep failure on the naive lane's
  create-with-pinned-deadline was ours (grader's team-scoped search
  excluded teamless stories); fixed in the 1.8 grader refactor.
- 2026-08-10 — Second sweep tier pinned: claude-opus-4-7 (not a cheap
  tier) — operationalizes the registered dual prediction (does a
  stronger driver erase toolset gaps?) and reconnects with the Phase 0
  hand-exam driver for continuity. Headline remains claude-sonnet-4-6:
  benchmarks should headline the driver real agent workloads run. A
  cheap tier (haiku-class) may be added later as a third lane if budget
  allows; it is not required for Report #1.
- 2026-08-10 — Headline driver id pinned at 1.6 first use:
  `claude-sonnet-4-6`. Same string as the dev tier pinned on 2026-08-03,
  so Phase 1 dev iteration and Report #1 numbers land under one model
  id. Disclosure: Phase 0 hand exams (0.10, 0.12) ran under
  `claude-opus-4-7` — a different model family — so Phase 0 evidence
  is not comparable to Phase 1 numbers on the driver axis. The
  `official` tier for Report #1 is the same string as `dev` until an
  independent choice at 1.10 says otherwise.
- 2026-08-10 — Harness first run surfaced curated-lane brittleness:
  strict boundary validation failed on soft-deleted comments
  (text: null), pre-registered in naive-first-run.md; the naive lane is
  immune by construction (no validation). Ledger entry against the
  curated lane: validation trades robustness-to-unseen-shapes for
  correctness guarantees. Fixed post-phase-0 (server freeze expired
  with the 0.13 commit); disclosed for Report #1. First-catch
  transcript retained at
  runs/2026-08-10T20-32-03-284Z/state-name-vs-type/shortcut-handbuilt/2026-08-10T20-32-03-284Z.jsonl.
- 2026-08-08 — Phase 0 exit reworded from "explains why it beats the
  naive one" to "characterizes, with evidence, how it differs and what
  Phase 1 must measure" — hand exams produce leads, not verdicts; the
  original wording presumed a conclusion the evidence discipline refuses
  at n=1. Verdicts belong to the Examiner. Precedent: the finish-line
  reframe of 2026-08-04.
- 2026-08-07 — Naive baseline generated by openapi-mcp-generator@4.0.1
  (MIT, harsha-iiiv), the sole survivor of a rubric-based survey
  (docs/reports/naive-converter-survey.md). Full generation command:
  `npx -y openapi-mcp-generator@4.0.1 --input docs/specs/shortcut-openapi.json --output servers/naive`
  — only `--input` and `--output`, no filtering. Spec snapshot:
  docs/specs/shortcut-openapi.json, retrieved 2026-08-07 from
  https://developer.shortcut.com/api/rest/v3/shortcut.openapi.json.
  The spec's security scheme is apiKey `api_token` in header
  `Shortcut-Token`; the generated server reads it from env var
  `API_KEY_API_TOKEN`. `API_BASE_URL` is optional (baked in as
  `https://api.app.shortcut.com`).
- 2026-08-07 — Hand-built baseline provenance: human-specified from real
  workflow (docs/specs/shortcut-handmade.md), AI-implemented under
  iterative expert review with live-API verification. Reports and the
  Phase 4 essay describe this lane as the "curated" baseline, never as
  purely human-authored; the shared-model-family overlap with the
  Designer is disclosed as a limitation.
- 2026-08-07 — create_story issues a single POST /stories with tasks and
  the linked story inline; Shortcut accepts both as arguments to the
  create call — verified against the live API — so the tool has no
  multi-step path and no partial-success state. If the create fails,
  nothing lands; if it succeeds, the whole story lands. Atomicity probe
  (2026-08-07): POST with a valid title and tasks but a story_link
  pointing at object_id 999999 returned HTTP 422 with
  `{"message":"Invalid param: object_id=|999999|"}`; the VERIFY-search
  total was 0 before and 0 after the call — nothing landed. A tool that
  half-succeeds and reports success would teach the model something
  false, so avoiding that state entirely is preferable to detecting and
  reporting it.
- 2026-08-06 — Workspace vocabulary (self, workflows, teams, members)
  fetched once at startup and cached in module scope; startup fetch
  failure is fatal (server exits before connecting) — freshness during
  a session is not required for benchmark chores, and fatal-startup
  surfaces token/network errors before an AI sees a half-working tool.
  Trade-off: mid-session mutations by other clients (new team, added
  state, invited member) are invisible until server restart.
- 2026-08-06 — Zod validates Shortcut API responses where a missing or
  renamed field would silently corrupt a result (anything returning ids
  used for later writes); plain type assertions elsewhere — silent shape
  drift is the real risk; a wrong shape that fails loudly self-reports.
- 2026-08-04 — Finish line reframed: measured shrinking gap to Official,
  parity as stretch — official toolsets embed non-public knowledge; the
  defensible claim is quantified approach, not victory.
- 2026-08-03 — Loop dev model: claude-sonnet-4-6 via ANTHROPIC_MODEL env — dev tier; official benchmark model chosen at Phase 1.
- 2026-08-03 — Spec-first for core components (Option B): agent loop, harness, graders, Designer prompts each get a short intent spec in docs/specs/ before AI builds; first spec supplied as template — stated intent makes review catch drift. Commits: docs(specs): add agent loop spec and chore(repo): command v2 writes STATUS.md and proposes next steps.
- 2026-08-03 — Toolchain pinned: pnpm 11.20.0, typescript 7.0.2, tsx 4.23.4, vitest 4.1.10, biome 2.5.6 — recorded at first install; lockfile is the source of truth.
- 2026-08-03 — Phase 0 loop authorship: Claude Code may write the code from Walid's own written spec; understanding proven by solo exercises (predict, extend, break, rebuild) — typing optional, comprehension not.
- 2026-08-02 — Name: AgentWorks (supersedes Agentworthy, Forgebench; AgentCalibre considered) — 'the works' that build toolsets plus the 'it works' the Examiner proves; free on npm, verified twice; 'agentworthy' stays lowercase as the verdict grade in reports.
- 2026-08-02 — Conventions v1 adopted (docs/CONVENTIONS.md) — decided once, argued never.
- 2026-08-02 — Repository private until Phase 4 — publish together with the benchmark essay.
- 2026-08-02 — Benchmark target: Shortcut via a free workspace — public API, official server to beat, daily intuition for golden tasks.
- 2026-08-02 — Stack per docs/STACK.md (TS strict, pnpm workspaces, MCP SDK, zod, SQLite + Drizzle, Biome defaults) — boring core, zero infrastructure.

## Pending

- Claude plan tier — leaning Pro; confirm against real usage after Phase 1.
- Phase 2 direction — refiner aggressiveness.
  2026-08-08 — Refiner aggressiveness is a design axis, not a fixed
  choice: the refiner (option a) should expose how much it reshapes the
  naive toolset, from aggressive prune (many tools dropped) through
  keep-all-and-improve (every endpoint kept, descriptions and responses
  fixed) to keep-all-and-organize (all kept, grouped so the common set
  is small with the long tail reachable). User preference for coverage
  vs simplicity is a setting. Which setting wins for which task profile
  is an Examiner measurement, not a decision to make in advance.
- Embeddings provider — Phase 2 gate (Voyage vs OpenAI).
- OpenAI cross-model lane — Phase 3 gate.
- Target-spec quality is an unmeasured variable. Phase 0 used Shortcut's
  professionally-maintained OpenAPI spec — near-ideal converter input.
  Hypothesis (2026-08-08): a messier small-company spec widens the
  curated-vs-naive gap (worse converter input) but may also degrade the
  curated lane's raw material; net direction unknown. Phase 3's second
  target should include a lower-quality spec to test generalization.
  Not a Phase 1 concern; logged so the single-target result is not
  over-read.
- License — decide at Phase 4 with publication.
