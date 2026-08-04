# AgentWorks, explained in plain words

A plain-words companion to PROJECT.md and STACK.md.

---

## The diagram in plain words

One machine, three rooms. The easiest way to hold it: a driving test where
the driver is never the one being judged. Same driver, four different cars,
same fixed course. The better car is the one that lets the driver finish
the course best.

**The green room is the exam (built first, Phases 0 and 1).** The course is
the golden tasks: short real chores in plain files, each with a checkable
definition of done ("a story named X now exists in the backlog").
`bench run` starts a test day. The driver is the AI agent; its seat comes
in two versions (Runtime A, the bare loop; Runtime B, the Agent SDK,
useful for checking whether the seat itself changes results). The driver's
brain is the model at Anthropic; every decision is an API call, which is
why that box is gray: an outside service. The MCP client is the cable
between driver and car, with two plug shapes: stdio for cars in our own
garage (local servers) and HTTP for the manufacturer's car that stays at
their building (the official remote server). A dashcam records everything:
the transcripts. Then the inspectors, the graders, apply their one rule:
never take the driver's word for anything. They check Shortcut's own
records (ground truth) to confirm the chore truly happened. Every
attempt's pass/fail, time, and cost lands in the scorebook (SQLite).
`bench diff` puts two scorebook pages side by side; the benchmark report
is the published scorecard.

**The amber row is the four cars.** Naive: auto-assembled by bolting on
every part in the catalog, 400 unlabeled buttons. Hand-built: crafted by
a person, twelve clear controls. Official: the car the vendor's own
engineers ship. Generated: the car our factory produces. All four take
the identical exam; change one thing only, the car, keep everything else
fixed.

**The blue room is the factory (Phase 2).** It reads two books, the
engineering manual (the API spec) and the human handbook (the docs), with
a small filing index so the Designer can pull the right pages fast. The
Designer draws a blueprint (`design.json`), plain data a human can read.
The Builder assembles the car from the blueprint using fixed templates.
The AI designs; the templates build.

**The dashed arrow is Phase 3, the loop.** Failure notes from each test
day travel back to the blueprint desk: wrong button pressed, confusing
label, missing control. The next blueprint gets better. That arrow is the
difference between a self-improving machine and a one-shot converter.

Reading keys: purple cylinders are filing cabinets, places where records
live; gray boxes are outside services. Build order runs opposite to the
arrows: exam room first, factory second, loop last, because the measuring
instrument comes before the factory. A factory nobody can grade is a
guess machine.

## The agent loop, step by step

In diagram terms, everything below happens inside one box, `Agent
runtime · A bare loop / B Agent SDK`, and its double arrow to
`Anthropic API`. The printed lines that scroll by are the seed of
`Transcripts · JSONL`. One box is deliberately missing: `MCP client ·
stdio + HTTP` does not exist in this code yet, because the two toy tools
live inside the same file; the cable gets built when there are real cars
to plug into.

The trace follows one real run of `packages/agent/src/index.ts` with the
prompt "What time will it be in 90 minutes?". One idea unlocks all of
it: **the API remembers nothing between calls.** Every call mails the
entire conversation so far. Our `messages` list IS the model's memory,
and we are its keeper.

1. **We prepare.** Read the API key and model name from the environment.
   Write the menu: two tool descriptions, each with a name, a plain
   sentence about what it does, and the exact shape of its inputs. The
   menu is pure text. The model never touches our functions; it can only
   read the menu and ask.

2. **We call `Anthropic API`, round one.** We put the user's question
   into `messages` and send everything: model name, the menu, the
   conversation.

3. **The model responds with a request, not an answer.** It cannot know
   the time, so it picks from the menu. The response contains a
   `tool_use` block: the tool name (`get_time`), the arguments it chose
   (none needed), and a ticket number (`id`). The response's
   `stop_reason` says `tool_use`, which means: "I stopped because I need
   you to run something."

4. **We record, then obey.** First we append the model's entire response
   to `messages`, so the memory stays complete. Then WE run the tool:
   our own TypeScript function reads the clock and returns a timestamp
   string. The model asks; our code executes. Always that direction.

5. **We report back.** We wrap the timestamp in a `tool_result` block
   stamped with the same ticket number, so the model knows which request
   this answers, append it to `messages`, and call `Anthropic API` again
   with the whole conversation.

6. **The model responds with a second request.** Now it knows the time
   but not the sum, so: `tool_use` again, this time `add_minutes` with
   arguments it filled to match our declared shape, the timestamp it
   just received plus `minutes: 90`. Notice it read our schema and
   complied. `stop_reason`: `tool_use` again.

7. **Same dance.** We record, run the date math in our own code, send
   the `tool_result` with its ticket number, call again.

8. **The model responds with the answer.** Everything it needs is now in
   the conversation, so the response is a plain `text` block, and
   `stop_reason` is `end_turn`, meaning "I'm done, nothing to run." Our
   loop sees that and stops.

What we store, today and later: today, the conversation lives in memory
and prints to the console. In Phase 1, this identical trace becomes a
file in `Transcripts · JSONL`, and the token counts riding on each API
response become the cost columns in `bench.sqlite`. The loop also
carries a seatbelt: a maximum of ten rounds, so a confused model can
never spin forever at our expense.

## Why the same driver drives all four cars

Because when everything except one thing is identical, any difference in
results can only have that one cause. Same driver, same course, same
day; only the car varies; therefore a score gap is the car's fault,
full stop.

Flip it to see the danger: `Hand-built` scores 85 with one model
driving, `Naive baseline` scores 70 with a different model driving.
Which was better, the car or the driver? Unanswerable; two things moved
at once and the comparison is dead. This is a controlled experiment:
isolate one variable. It is also why exactly one pinned "official" model
produces every number in the reports: the driver must hold still, or
the car scores mean nothing.
