# Shortcut hand-built toolset — verification record

**Date:** 2026-08-07.

## Commits evidenced

- `d62fe86` feat(servers): add read tools to hand-built shortcut server
- `a0fe213` feat(servers): add write tools to hand-built shortcut server
- `8dab14f` fix(servers): correct default state and link-direction semantics

## Ten-tool listing

Server: `@agentworks/shortcut-handbuilt` on stdio. Tools reported by
`ListTools` after connect:

```
tools: whoami, list_workspace_vocabulary, list_my_stories,
       list_team_stories, find_stories, get_story, create_story,
       move_story, comment_on_story, update_story
```

## Read tools — raw output

### whoami

```
=== whoami({}) ===
{
  "content": [
    { "type": "text", "text": "{\"id\":\"6a74c42b-7c4e-479e-9694-33ad6e185282\",\"name\":\"Walid Hl\",\"mention_name\":\"walidhl\"}" }
  ]
}
```

### list_workspace_vocabulary

```
=== list_workspace_vocabulary({}) ===
{
  "content": [
    { "type": "text", "text": "{\"teams\":[{\"id\":\"6a74c42b-5b5b-40ea-ab88-f2b6a8db9e85\",\"name\":\"Walid Hl's Team\",\"mention_name\":\"walid-hls-team\"}],\"workflows\":[{\"id\":500000005,\"name\":\"Standard\",\"states\":[{\"id\":500000006,\"name\":\"Backlog\",\"type\":\"backlog\"},{\"id\":500000007,\"name\":\"To Do\",\"type\":\"unstarted\"},{\"id\":500000008,\"name\":\"In Progress\",\"type\":\"started\"},{\"id\":500000009,\"name\":\"In Review\",\"type\":\"started\"},{\"id\":500000010,\"name\":\"Done\",\"type\":\"done\"}]}],\"story_types\":[\"feature\",\"bug\",\"chore\"]}" }
  ]
}
```

### list_my_stories

Success — no filter:

```
=== list_my_stories({}) ===
{
  "content": [
    { "type": "text", "text": "{\"stories_by_state\":{\"To Do\":[{\"id\":22,\"title\":\"Connect in Slack\",\"state\":\"To Do\",\"team\":\"Walid Hl's Team\",\"due_date\":null}],\"Backlog\":[{\"id\":30,\"title\":\"Connect in Slack\",\"state\":\"Backlog\",\"team\":\"Walid Hl's Team\",\"due_date\":null}],\"In Review\":[{\"id\":23,\"title\":\"Accelerate your team with Agents\",\"state\":\"In Review\",\"team\":\"Walid Hl's Team\",\"due_date\":null}],\"In Progress\":[{\"id\":17,\"title\":\"Get Started with Shortcut\",\"state\":\"In Progress\",\"team\":\"Walid Hl's Team\",\"due_date\":\"2026-08-13T00:00:00Z\"}]},\"total\":4,\"returned\":4,\"truncated\":false}" }
  ]
}
```

Success — with `state: "in progress"` (case-insensitive):

```
=== list_my_stories({"state":"in progress"}) ===
{
  "content": [
    { "type": "text", "text": "{\"stories_by_state\":{\"In Progress\":[{\"id\":17,\"title\":\"Get Started with Shortcut\",\"state\":\"In Progress\",\"team\":\"Walid Hl's Team\",\"due_date\":\"2026-08-13T00:00:00Z\"}]},\"total\":4,\"returned\":4,\"truncated\":false}" }
  ]
}
```

Failure — unknown state:

```
=== list_my_stories({"state":"doing"}) ===
{
  "content": [
    { "type": "text", "text": "unknown state: doing. Valid states: Backlog, To Do, In Progress, In Review, Done" }
  ],
  "isError": true
}
```

### list_team_stories

Success — full team board:

```
=== list_team_stories({"team":"walid-hls-team"}) ===
{
  "content": [
    { "type": "text", "text": "{\"stories_by_state\":{\"To Do\":[{\"id\":22,\"title\":\"Connect in Slack\",\"state\":\"To Do\",\"team\":\"Walid Hl's Team\",\"due_date\":null},{\"id\":21,\"title\":\"Share Progress with the Roadmap\",\"state\":\"To Do\",\"team\":\"Walid Hl's Team\",\"due_date\":\"2026-07-09T04:00:00Z\"},{\"id\":18,\"title\":\"Break work down in the Shortcut Way\",\"state\":\"To Do\",\"team\":\"Walid Hl's Team\",\"due_date\":\"2026-08-21T04:00:00Z\"},{\"id\":25,\"title\":\"What's next?\",\"state\":\"To Do\",\"team\":\"Walid Hl's Team\",\"due_date\":null},{\"id\":24,\"title\":\"Invite your team\",\"state\":\"To Do\",\"team\":\"Walid Hl's Team\",\"due_date\":null},{\"id\":20,\"title\":\"Customize for your Team\",\"state\":\"To Do\",\"team\":\"Walid Hl's Team\",\"due_date\":null}],\"Done\":[{\"id\":19,\"title\":\"Automate with GitHub or GitLab\",\"state\":\"Done\",\"team\":\"Walid Hl's Team\",\"due_date\":null}],\"Backlog\":[{\"id\":30,\"title\":\"Connect in Slack\",\"state\":\"Backlog\",\"team\":\"Walid Hl's Team\",\"due_date\":null}],\"In Review\":[{\"id\":23,\"title\":\"Accelerate your team with Agents\",\"state\":\"In Review\",\"team\":\"Walid Hl's Team\",\"due_date\":null}],\"In Progress\":[{\"id\":17,\"title\":\"Get Started with Shortcut\",\"state\":\"In Progress\",\"team\":\"Walid Hl's Team\",\"due_date\":\"2026-08-13T00:00:00Z\"}]},\"total\":10,\"returned\":10,\"truncated\":false}" }
  ]
}
```

Failure — unknown team:

```
=== list_team_stories({"team":"not-a-team"}) ===
{
  "content": [
    { "type": "text", "text": "unknown team: not-a-team. Valid teams: walid-hls-team" }
  ],
  "isError": true
}
```

### find_stories

Success — matches:

```
=== find_stories({"query":"Slack"}) ===
{
  "content": [
    { "type": "text", "text": "{\"stories\":[{\"id\":22,\"title\":\"Connect in Slack\",\"state\":\"To Do\",\"team\":\"Walid Hl's Team\",\"due_date\":null},{\"id\":30,\"title\":\"Connect in Slack\",\"state\":\"Backlog\",\"team\":\"Walid Hl's Team\",\"due_date\":null}],\"total\":2,\"returned\":2,\"truncated\":false}" }
  ]
}
```

Edge — non-word-prefix substring returns empty (tokenized, not substring):

```
=== find_stories({"query":"lack"}) ===
{
  "content": [
    { "type": "text", "text": "{\"stories\":[],\"total\":0,\"returned\":0,\"truncated\":false}" }
  ]
}
```

Success — word-prefix match:

```
=== find_stories({"query":"automat"}) ===
{
  "content": [
    { "type": "text", "text": "{\"stories\":[{\"id\":19,\"title\":\"Automate with GitHub or GitLab\",\"state\":\"Done\",\"team\":\"Walid Hl's Team\",\"due_date\":null}],\"total\":1,\"returned\":1,\"truncated\":false}" }
  ]
}
```

### get_story

Story with tasks and a symmetric link (both sides read "relates to"):

```
=== get_story({"id":22}) ===
{
  "content": [
    { "type": "text", "text": "{\"id\":22,\"title\":\"Connect in Slack\",\"state\":\"To Do\",\"story_type\":\"chore\",\"team\":\"Walid Hl's Team\",\"owners\":[\"walidhl\"],\"requester\":\"walidhl\",\"due_date\":null,\"description\":\"![slack.png](https://static.shortcut.com/images/onboarding/slack.png)\\n\\n## If your team uses Slack, enable this integration to keep your workflow and communication in sync.\\n- See Story updates in a dedicated channel\\n- Create new Stories from Slack messages\\n- Sync threaded conversations between Slack and Shortcut\\n- Set up [personal Slack notifications](https://app.shortcut.com/agentworks/settings/account/notifications) in Settings > Notifications\\n\\n### [→ Connect Slack](https://app.shortcut.com/agentworks/settings/integrations/slack)\",\"tasks\":[{\"description\":\"Investigation\",\"complete\":false},{\"description\":\"Implementation\",\"complete\":false},{\"description\":\"Review\",\"complete\":false}],\"comments\":[],\"story_links\":[{\"verb\":\"relates to\",\"other_story_id\":23}]}" }
  ]
}
```

Reverse side of the same "relates to" link:

```
=== get_story({"id":23}) ===
{
  "content": [
    { "type": "text", "text": "{\"id\":23,\"title\":\"Accelerate your team with Agents\",\"state\":\"In Review\",\"story_type\":\"chore\",\"team\":\"Walid Hl's Team\",\"owners\":[\"walidhl\"],\"requester\":\"walidhl\",\"due_date\":null,\"description\":\"![korey+mcp.png](https://static.shortcut.com/images/onboarding/korey+mcp.png)\\n\\n## Korey\\nKorey is an AI agent that accelerates your product engineering workflows.\\n### [→ Get Started with Korey](https://korey.ai/)\\n\\n---\\n\\n## Shortcut MCP Server\\nOur [ Shortcut MCP Server](https://github.com/useshortcut/mcp-server-shortcut) allows you to connect Shortcut to tools like Cursor, Windsurf, Claude Code, and more. Access and edit Stories, Sub-tasks, and Epics to get your agents coding and connect the output directly to Github.\\n\\n### [→ Learn More](https://help.shortcut.com/hc/en-us/articles/36443434285844-MCP-Server)\",\"tasks\":[],\"comments\":[{\"author\":\"walidhl\",\"text\":\"Ready for review\",\"created_at\":\"2026-08-06T17:55:53Z\"}],\"story_links\":[{\"verb\":\"relates to\",\"other_story_id\":22}]}" }
  ]
}
```

Asymmetric-verb direction after `8dab14f`: subject side reads `blocks`,
object side reads `blocked by`. Captured mid-verification (story 47 was
subsequently deleted; the link on story 17 was removed with it):

```
=== get_story({"id":47}) ===      # subject side
{
  "content": [
    { "type": "text", "text": "{\"id\":47,\"title\":\"VERIFY - blocks link\",\"state\":\"To Do\",\"story_type\":\"chore\",\"team\":\"Walid Hl's Team\",\"owners\":[\"walidhl\"],\"requester\":\"walidhl\",\"due_date\":null,\"description\":\"\",\"tasks\":[],\"comments\":[],\"story_links\":[{\"verb\":\"blocks\",\"other_story_id\":17}]}" }
  ]
}

=== get_story({"id":17}) ===      # object side, verb inverted
{
  "content": [
    { "type": "text", "text": "{\"id\":17,\"title\":\"Get Started with Shortcut\",\"state\":\"In Progress\",\"story_type\":\"feature\",\"team\":\"Walid Hl's Team\",\"owners\":[\"walidhl\"],\"requester\":\"walidhl\",\"due_date\":\"2026-08-13T00:00:00Z\",\"description\":\"https://youtu.be/An55mZ-k884?si=unrC_p_ULNAS70JO\\n## Welcome to Shortcut!\\nWe've put together these sub-tasks for you to move through in trial.\\n\\n### Quick Tips\\n- Move quickly with `cmd k` and Keyboard Shortcuts\\n- Use Markdown\\n- Use and react with emoji ✨\\n- `@mention` teammates\\n- Drag and drop images or videos (Loom & YouTube auto-embed)\",\"tasks\":[],\"comments\":[],\"story_links\":[{\"verb\":\"blocked by\",\"other_story_id\":47}]}" }
  ]
}
```

## Write tools — raw output

### create_story

Success — default state (workflow's configured default: "To Do"):

```
=== create_story({"title":"VERIFY - default state","team":"walid-hls-team","story_type":"chore"}) ===
{
  "content": [
    { "type": "text", "text": "{\"id\":46,\"title\":\"VERIFY - default state\",\"state\":\"To Do\",\"team\":\"Walid Hl's Team\",\"due_date\":null,\"url\":\"https://app.shortcut.com/agentworks/story/46\"}" }
  ]
}
```

Success — with inline tasks:

```
=== create_story({"title":"VERIFY - basic create with tasks","team":"walid-hls-team","story_type":"chore","description":"created by verify","tasks":["step 1","step 2"]}) ===
{
  "content": [
    { "type": "text", "text": "{\"id\":40,\"title\":\"VERIFY - basic create with tasks\",\"state\":\"Backlog\",\"team\":\"Walid Hl's Team\",\"due_date\":null,\"url\":\"https://app.shortcut.com/agentworks/story/40\"}" }
  ]
}
```

Note: story 40 above shows `"state":"Backlog"` — this run predates
8dab14f which changed the default from first-by-position (Backlog) to
`Workflow.default_state_id` (To Do). Story 46 above shows the post-fix
behaviour.

Success — with inline `story_links`:

```
=== create_story({"title":"VERIFY - create with link","team":"walid-hls-team","story_type":"chore","linked_story":{"verb":"relates to","other_story_id":40}}) ===
{
  "content": [
    { "type": "text", "text": "{\"id\":43,\"title\":\"VERIFY - create with link\",\"state\":\"Backlog\",\"team\":\"Walid Hl's Team\",\"due_date\":null,\"url\":\"https://app.shortcut.com/agentworks/story/43\"}" }
  ]
}

=== create_story({"title":"VERIFY - blocks link","team":"walid-hls-team","story_type":"chore","linked_story":{"verb":"blocks","other_story_id":17}}) ===
{
  "content": [
    { "type": "text", "text": "{\"id\":47,\"title\":\"VERIFY - blocks link\",\"state\":\"To Do\",\"team\":\"Walid Hl's Team\",\"due_date\":null,\"url\":\"https://app.shortcut.com/agentworks/story/47\"}" }
  ]
}
```

Failure — unknown team:

```
=== create_story({"title":"VERIFY - should fail","team":"not-a-team","story_type":"chore"}) ===
{
  "content": [
    { "type": "text", "text": "unknown team: not-a-team. Valid teams: walid-hls-team" }
  ],
  "isError": true
}
```

### move_story

Success — case-insensitive state name:

```
=== move_story({"id":40,"state":"in progress"}) ===
{
  "content": [
    { "type": "text", "text": "{\"id\":40,\"title\":\"VERIFY - basic create with tasks\",\"state\":\"In Progress\",\"team\":\"Walid Hl's Team\",\"due_date\":null,\"url\":\"https://app.shortcut.com/agentworks/story/40\"}" }
  ]
}
```

Failure — unknown state:

```
=== move_story({"id":40,"state":"doing"}) ===
{
  "content": [
    { "type": "text", "text": "unknown state: doing. Valid states: Backlog, To Do, In Progress, In Review, Done" }
  ],
  "isError": true
}
```

### comment_on_story

Success — author id translated to mention_name:

```
=== comment_on_story({"id":40,"text":"verify comment"}) ===
{
  "content": [
    { "type": "text", "text": "{\"story_id\":40,\"comment_id\":44,\"author\":\"walidhl\",\"text\":\"verify comment\",\"created_at\":\"2026-08-07T13:56:57Z\"}" }
  ]
}
```

Failure — unknown story id (HTTP 404 surfaced):

```
=== comment_on_story({"id":999999,"text":"nope"}) ===
{
  "content": [
    { "type": "text", "text": "Shortcut 404 Not Found: {\"message\":\"Resource not found.\"}" }
  ],
  "isError": true
}
```

### update_story

Success — mention_names resolved to owner ids:

```
=== update_story({"id":40,"description":"updated description","owners":["walidhl"]}) ===
{
  "content": [
    { "type": "text", "text": "{\"id\":40,\"title\":\"VERIFY - basic create with tasks\",\"state\":\"In Progress\",\"team\":\"Walid Hl's Team\",\"due_date\":null,\"url\":\"https://app.shortcut.com/agentworks/story/40\"}" }
  ]
}
```

Failure — unknown owner mention_name:

```
=== update_story({"id":40,"owners":["nonexistent-user"]}) ===
{
  "content": [
    { "type": "text", "text": "unknown member: nonexistent-user" }
  ],
  "isError": true
}
```

## Atomicity probe

Direct API probe (before writing the tool) — POST with a valid title
and tasks but a `story_links.object_id` that does not exist:

```
$ curl -sH "Shortcut-Token: $TOKEN" "https://api.app.shortcut.com/api/v3/search/stories?query=VERIFY&page_size=25" | jq '{total, names: [.data[].name]}'
{
  "total": 0,
  "names": []
}

$ curl -sX POST -H "Shortcut-Token: $TOKEN" -H "Content-Type: application/json" \
    -d '{"name":"VERIFY - atomicity bad link","story_type":"chore","group_id":"6a74c42b-5b5b-40ea-ab88-f2b6a8db9e85","workflow_state_id":500000007,"tasks":[{"description":"should not land"}],"story_links":[{"verb":"relates to","object_id":999999}]}' \
    -w "\nHTTP %{http_code}\n" \
    https://api.app.shortcut.com/api/v3/stories
{"message":"Invalid param: object_id=|999999|"}
HTTP 422

$ curl -sH "Shortcut-Token: $TOKEN" "https://api.app.shortcut.com/api/v3/search/stories?query=VERIFY&page_size=25" | jq '{total, names: [.data[].name]}'
{
  "total": 0,
  "names": []
}
```

Same behaviour through the tool:

```
[VERIFY search] total=0, names=[]

=== create_story({"title":"VERIFY - atomicity bad link via tool","team":"walid-hls-team","story_type":"chore","linked_story":{"verb":"relates to","other_story_id":999999}}) ===
{
  "content": [
    { "type": "text", "text": "Shortcut 422 Unprocessable Entity: {\"message\":\"Invalid param: object_id=|999999|\"}" }
  ],
  "isError": true
}

[VERIFY search] total=0, names=[]
```

VERIFY-search total was 0 before the call and 0 after. Nothing landed.

## Cleanup record

Stories created during verification (all prefixed "VERIFY -"):

- 35 — endpoint probe (create with inline tasks and links)
- 38 — endpoint probes (PUT state, POST comment)
- 40 — create_story tool verify (basic create with tasks)
- 43 — create_story tool verify (create with "relates to" link to 40)
- 45 — blocks-direction API probe
- 46 — create_story tool verify (default state)
- 47 — create_story tool verify (blocks link to 17)

Comments created (inside VERIFY stories, cascaded on parent delete):

- 39 — inside story 38 (POST comment probe)
- 44 — inside story 40 (comment_on_story verify)

Cleanup HTTP status:

```
DELETE /stories/35 -> HTTP 204
DELETE /stories/38 -> HTTP 204
DELETE /stories/40 -> HTTP 204
DELETE /stories/43 -> HTTP 204
DELETE /stories/45 -> HTTP 204
DELETE /stories/46 -> HTTP 204
DELETE /stories/47 -> HTTP 204
```

Follow-up GET on a deleted probe (story 35) confirmed removal:

```
GET /stories/35 -> HTTP 404
```

**Seeded stories (ids 17–30) were not mutated by any verification
step.** The one exception is story 17, which received a temporary link
from probe story 45 (see the get_story object-side output above); when
story 45 was deleted the link was removed with it, restoring 17 to its
seeded state.
