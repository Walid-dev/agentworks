# Spec: golden-task format (tasks/*.yaml)

Intent: one file describes one exam question completely — what to ask
the agent, what the workspace must look like before the attempt, and
how to decide pass or fail against reality, deterministically. A task
file must be readable by a person and checkable by a machine, and the
same file must work unchanged against every lane (curated, naive,
official).

## What it does

A golden task is a YAML file under `tasks/` with these fields:

- `id` — stable slug, unique, kebab-case (`state-name-vs-type`).
- `class` — which finding family it probes, one of:
  `state-trap`, `duplicate-check`, `orientation`, `write`,
  `info-vs-cost`, `hierarchy`. Reports aggregate by class.
- `prompt` — the exact user message, one string, sent verbatim as the
  single user turn. Rules learned in Phase 0:
  - No tool names, no hints about how.
  - Self-sufficient about where: the runner tells every lane's agent
    "you operate a Shortcut workspace through the provided tools"
    (harness spec), so prompts never need an "in shortcut" clarifier.
  - Dates are absolute ("due 2026-08-14") unless the task's class is
    specifically testing relative-date handling.
  - Read tasks phrase for an extractable answer ("reply with the story
    ids, comma-separated"), because deterministic graders cannot judge
    free prose.
- `setup` — optional list of fixture stories to create before each
  attempt. Each entry declares the story's `title`, `state`,
  `story_type`, and any fields the task needs — including optional
  `priority`. Each entry may declare an optional `ref`: a stable name
  other parts of the task can point at (for example,
  `answer_ids: { equals_fixture: <ref> }` in a grade check).
  Titles may contain `{{run}}`, a unique stamp the harness substitutes
  per attempt so repetitions never collide — the course-reset rule as a
  placeholder. Teardown is derived from setup plus anything the attempt
  created; tasks never hand-write teardown.
- `expected_tools` — optional map from lane id to the tool names an
  ideal attempt would use (`shortcut-handbuilt: [list_my_stories]`).
  Tool-selection accuracy is scored only for lanes listed; absent lane,
  metric skipped. Optional because lanes name tools differently and
  the official lane's names may change under us.
- `grade` — the deterministic checks, all of which must pass. v1 check
  vocabulary, each verified against Shortcut's REST API as ground
  truth, never against the agent's words:
  - `story_exists`: by title (tolerances apply), with optional field
    assertions — `state_name`, `story_type`, `owner_is_self`, `team`,
    `deadline_within`, `tasks` (list, tolerances apply),
    `description_contains`.
  - `story_absent`: by title — for duplicate-check tasks.
  - `comment_on`: story ref, `text_contains`.
  - `answer_ids`: the final assistant message must contain exactly this
    set of story ids (set comparison on extracted numbers) — the
    deterministic way to grade read tasks. Variants:
    - `answer_ids: { equals_state: "<state name>" }` — the id set of
      stories currently in that named workflow state, computed live
      from Shortcut at grading time.
    - `answer_ids: { equals_fixture: "<ref>" }` — passes when the id
      set equals exactly the live id the named `setup` fixture
      received at setup time.
  - `workspace_unchanged`: nothing beyond fixtures was created or
    modified — catches destructive wandering on read tasks.
- `tolerances` — task-level defaults, overridable per check:
  - `casing`: `insensitive` (default) or `exact`.
  - `date_window`: a deadline passes if it falls anywhere inside the
    named calendar day in `timezone` (default `America/Toronto`).
- `provenance` — fixed string: `ai-drafted, human-reviewed`, the same
  disclosure the curated toolset carries.
- `notes` — optional, for humans: which Phase 0 finding this task
  descends from, with the report section (e.g. "handbuilt-vs-naive §4a").

One illustrative example (the state-trap pilot):

```yaml
id: state-name-vs-type
class: state-trap
prompt: >
  Which stories are in the In Progress column right now? Reply with
  just the story ids, comma-separated.
expected_tools:
  shortcut-handbuilt: [list_my_stories, list_team_stories]
grade:
  - answer_ids: { equals_state: "In Progress" }
  - workspace_unchanged: true
tolerances:
  casing: insensitive
provenance: ai-drafted, human-reviewed
notes: descends from handbuilt-vs-naive.md §4a; naive lanes resolved
  "working on" via a type filter and swept In Review in, 2/2 sessions.
```

(`equals_state` means: the grader asks Shortcut which stories are in
the state literally named "In Progress" at grading time, and the
answer's id set must equal that — ground truth computed live, never
hard-coded, so fixtures and drift can't stale the key.)

## Boundaries

- Single prompt per attempt. No follow-ups, no clarifications, no
  simulated user. If a task needs conversation, it is not a v1 task.
- Deterministic checks only. No LLM-as-judge anywhere in grading.
- No cross-task dependencies; every task starts from the documented
  baseline plus its own fixtures.
- Repetition counts, driver ids, and lane selection belong to the
  harness run configuration, never to task files.
- The check vocabulary is closed: a task needing a new check type first
  amends this spec in its own commit.

## Done when

The three pilot tasks named in PLAN.md 1.3 — the state trap, the
timezone-pinned write, and the info-loss-vs-coordination probe — can be
written completely in this format on paper, using only the fields and
checks above, with no new vocabulary invented. The paper test precedes
any code; the zod schema in 1.4 is derived from this file.
