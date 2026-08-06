# Spec: hand-built Shortcut MCP toolset (servers/shortcut-handbuilt)

Intent: a small toolset shaped around the chores actually done in a
normal week of Shortcut use, not around the API's endpoint list. Each
tool covers a whole chore an assistant can be asked for in one sentence.
This is the expert baseline the generated toolset will be measured
against.

## What it does

Ten tools.

**Orientation**

1. `whoami` — return the current user's id, name, and mention name.
   Needed because most chores refer to "me" (my stories, assign me as
   owner) and the API only speaks in ids.
2. `list_workspace_vocabulary` — return the workspace's teams, workflow
   states in order, and story types. Needed because state names and team
   ids are workspace-specific: without this, an assistant guesses state
   names and fails.

**Reading**

3. `list_my_stories` — stories where I am owner, grouped by workflow
   state. Optional filter by state. Returns id, title, state, team, due
   date. The morning check.
4. `list_team_stories` — same shape, for one team, so the board can be
   reviewed without being the owner.
5. `find_stories` — search by words in the title. Returns the same
   compact shape as the lists above.
6. `get_story` — one story in full: state, description, owners,
   requester, team, due date, tasks with their done status, comments in
   order, and linked stories. This is the "open the card and read it"
   chore, in one call.

**Writing**

7. `create_story` — one call for the whole creation chore: title,
   description, team, story type, optional due date, optional list of
   tasks, optional linked story, and flags to set me as owner and
   requester. Deliberately bundles several API operations, because
   creating a card is one chore, not five.
8. `move_story` — change a story's workflow state. Separate from general
   editing because it is the single most frequent action, and a narrow
   tool with valid state names is far harder to misuse than a generic
   update.
9. `comment_on_story` — add a comment. The routine progress update.
10. `update_story` — edit title, description, due date, owners, or team
    on an existing story. For new findings that change the card itself.

## Boundaries

- Read and write ordinary story fields only. No deleting stories, no
  bulk operations, no workspace administration.
- No file attachments in v1. Sending binary files through a toolset is a
  separate problem and would distort the comparison.
- No epics, iterations, or labels unless they turn out to be part of a
  weekly chore.
- Every tool returns only the fields its chore needs. Raw API responses
  are trimmed, never passed through whole.
- Every tool description states what it does, when to use it, and what it
  returns, written to be read by another AI.
- Tools that need ids accept human input where possible: a story id or a
  title fragment, a team name rather than a uuid.

## Done when

Inside a real AI assistant connected to this server, each of these
requests succeeds by conversation, with no manual id lookups:

- "What am I working on?"
- "Show me the team's board."
- "Open the story about <topic> and tell me where it stands."
- "Add a comment on story <id>: found the cause, it's the cache."
- "Create a story titled <title> for team <team>, assign it to me, with
  these three tasks, due Friday."
- "Move story <id> to in progress."
- "Update story <id>'s description with these findings."
