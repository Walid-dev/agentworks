# EXAM.md — running a toolset exam by hand

How to verify a toolset inside a real AI assistant, in isolation. Used
by steps 0.10 and 0.12, and it is the manual version of what the
Examiner automates in Phase 1.

## The rig, same every time

1. One config file per toolset at the repo root, named
   `mcp-exam-<target>.json` (gitignored by pattern; contains the API
   token, created by hand, never by an agent):

   {
     "mcpServers": {
       "<target>": {
         "command": "npx",
         "args": ["-y", "tsx", "<absolute path to the server entry>"],
         "env": { "SHORTCUT_API_TOKEN": "<token>" }
       }
     }
   }

2. Launch from an empty folder OUTSIDE the repo, so no CLAUDE.md or
   project rules ride into the exam:

   cd ~/agentworks-exam
   claude --strict-mcp-config --mcp-config <absolute path to the config>

   The two flags are the isolation: only the servers in the config
   exist. No global servers, no connectors.

3. First action in the session: /mcp. Exactly one server, connected.
   Anything else visible: stop, do not run the exam.

## Running the chores

- The chores come from the toolset's spec, its "Done when" list. Same
  chores for every toolset, that is the whole point.
- One chore at a time, phrased naturally. Never name tools, never hint
  at how, never correct a wrong turn mid-chore. The assistant works or
  it does not; both are findings.
- If a chore's phrasing is ambiguous about WHERE to act (the assistant
  may look at files, memory, or tools), a minimal clarifier like
  "in shortcut" is allowed and must be recorded. Learned in 0.10: "What
  am I working on?" is not self-evidently a Shortcut question.

## Recording

Notes per chore, taken as you go: exact phrasing used; tools called and
their order; wrong turns and retries; clarifying questions asked;
anything slow or confusing; ids of anything created. Created stories
stay in place until the report is written; they are evidence.

If a session cannot be captured in full, record the gap explicitly;
never reconstruct.

Record the driver model whenever the interface reveals it; the Phase 1
runtime pins it explicitly. Session logs under `~/.claude/projects/`
are the recovery path for call-level detail; prefer recovering the
tape over re-running the exam.

Notes become docs/reports/<target>-first-run.md.

## Purity rules

- One toolset per session, always. Two connected servers make the exam
  meaningless.
- Fresh session per exam. If the assistant recalls memory from prior
  sessions ("recalled N memories"), note it: remembered context
  contaminates comparison between runs. The Phase 1 runtime must start
  amnesiac every attempt.
- Every exam starts from the documented baseline state — currently
  `docs/reports/baseline-2026-08-11.md`, which supersedes the baseline
  sections in `naive-first-run.md` and `handbuilt-first-run.md`.
  Artifacts an exam creates are documented in
  its report, then removed: the course resets between cars. The
  workspace is a lab bench; reports are the archive.
