# Spec: the harness (packages/harness)

Intent: the machine that runs golden tasks against toolsets and records
everything, so that grading and comparison happen on evidence, never on
memory. It automates exactly what Phase 0 did by hand — isolated
session, clean course, one lane, full recording — and removes the
failure modes the hand exams hit: contaminated courses, unrecorded
drivers, unrecoverable call detail, entangled chores.

## What it does

One attempt is the unit of work. An attempt is: one golden task, one
lane, one driver, once. The harness runs attempts and writes records.

**Per attempt, in order:**

1. **Baseline check.** Verify the workspace matches the documented
   baseline (the fixture stories, nothing else). Refuse to run if it
   does not — a dirty course fails loudly before it can corrupt a
   number.
2. **Setup.** Create the task's fixtures, substituting `{{run}}` with
   this attempt's unique stamp so repetitions never collide.
3. **Run.** Start the lane's MCP server fresh, connect the agent
   runtime, send the task's prompt as the single user turn, and let it
   work to completion or to the turn cap. The runtime's system prompt
   states, identically for every lane: the agent operates a Shortcut
   workspace through the provided tools.
4. **Record.** Every tool call — name, input, output, timestamp — plus
   the final answer, token counts from the API usage fields, driver id,
   lane id, task id, run stamp, wall-clock times. Written as one JSONL
   transcript under `runs/<sweep>/<task>/<lane>/<attempt>.jsonl` while
   it happens, not reconstructed after.
5. **Grade.** The graders (their own step) read the transcript and the
   live workspace and write pass/fail plus measurements.
6. **Teardown.** Delete everything the attempt created — fixtures and
   agent-created artifacts, found by the run stamp — then re-verify the
   baseline. The teardown check's output is part of the attempt's
   record. Capture before destroy, always.

**Agent runtimes.** One interface, so the seat can vary while the exam
stays fixed:

- Runtime A — the bare loop, grown from `packages/agent`: raw Anthropic
  SDK, MCP client over stdio, amnesiac every attempt, no product
  features. The canonical instrument; every reported number comes from
  it.
- Runtime B — Agent SDK lane, optional, later: same interface, used to
  measure whether the seat itself changes results. Never the source of
  headline numbers in Phase 1.

**Drivers.** The model id is a parameter of every attempt, recorded in
its transcript. Pinned ids live in config and decisions.md; the harness
refuses an attempt with no explicit driver id. Sameness is enforced,
never assumed — the Phase 0 luck, made law.

**Sweeps.** A sweep is a set: tasks × lanes × repetitions × drivers,
run as attempts with the isolation above. Sweeps are resumable — an
interrupted sweep continues from its completed attempts rather than
rerunning them — because a sweep at full size is hundreds of paid API
calls. Concurrency is capped (p-limit) and failures retry politely
(p-retry), per STACK.md.

**Storage.** Transcripts are the truth: JSONL on disk, one file per
attempt. The SQLite file (`runs/bench.sqlite`) is derived from
transcripts and rebuildable from them at any time; if the two disagree,
the transcripts win. Canonical data lives in files.

## Boundaries

- No LLM-as-judge anywhere.
- No dashboard, no web UI. The CLI and markdown reports are the whole
  interface in Phase 1.
- The harness never edits toolsets, tasks, or specs; it runs and
  records. Improvement loops are Phase 3.
- Latency is compared only within the same transport; stdio and remote
  HTTP numbers never share a table row.
- Secrets come from the environment; no token is ever written into a
  transcript, a config, or the database. Transcripts must be safe to
  commit.
- One workspace, one attempt at a time against it. Parallelism across
  attempts that touch the workspace is out of scope for v1: correctness
  of isolation beats speed.

## Done when

The three pilot tasks run as attempts against both local lanes with
three repetitions each — eighteen attempts — producing: a JSONL
transcript per attempt with every call recorded; a baseline
verification and a teardown verification in every attempt's record; a
rebuildable bench.sqlite; and zero collisions between repetitions. One
attempt interrupted mid-sweep and resumed proves resumability. All of
it runnable by one command.
