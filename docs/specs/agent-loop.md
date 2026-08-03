# Spec: bare agent loop (packages/agent)

Intent: prove the raw mechanics of an agent are understood before any
framework hides them. One file, no abstractions.

What it does:
1. Sends a user prompt to the Anthropic API with two toy tools declared:
   get_time and add_minutes.
2. When the model replies with a tool request, runs that tool locally and
   sends the result back.
3. Repeats until the model replies with plain text instead of a tool request.
4. Prints the full conversation as it happens: every message, every tool
   call with its arguments, every tool result, the final answer.

Boundaries:
- Raw @anthropic-ai/sdk only. No frameworks, no MCP, no streaming, no
  retries, no config system. Model ID and API key come from env.
- One file, roughly 100 lines. Ugly is acceptable; unclear is not.

Done when: the prompt "What time will it be in 90 minutes?" produces a
transcript showing both tools used in sequence and a correct final answer.