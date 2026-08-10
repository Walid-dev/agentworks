# AgentWorks

_A machine that teaches AI agents to use any software, and proves it with numbers._

---

## What this is, in plain words

AI assistants are learning to do real work: manage projects, book appointments, process orders. To act, an assistant needs **tools**: clearly described actions it is allowed to perform, such as "create a task" or "find an invoice".

Today, giving an AI a good set of tools for a piece of software is manual, expert craftsmanship. Done automatically and naively, the result is poor: the AI receives hundreds of confusing options and fails often. Done by hand, it takes an expert real time, for every single piece of software in the world.

This project builds the machine that does the expert's job automatically. Point it at the technical description of any software's interface (its API). It studies that description plus the human documentation, designs a small set of clear, well-explained tools, generates the working code, and then, this is the heart of it, **tests the result the way a driving examiner tests a student**: real tasks, pass or fail, measured and scored.

## The problem, with an analogy

Think of an API as a 400-page instruction manual for a machine.

- The naive approach hands the AI all 400 pages as 400 separate buttons. The AI gets lost, presses wrong buttons, wastes time and money.
- The expert approach reads the manual and builds a dashboard with 12 clear, labeled controls covering what people actually do. The AI succeeds.

Experts building those dashboards by hand cannot keep up with the amount of software in the world. Our machine builds the dashboard automatically, then measures whether it is truly as good as the hand-made one.

## What we are building: three parts

1. **The Designer.** An AI that reads the manual (the API description) and the human docs, then decides: which few tools should exist, what they should be called, and how they should be explained so another AI never misunderstands them.
2. **The Builder.** Takes the Designer's decisions and generates working code from templates. Deliberately boring and predictable: the AI designs, the templates build. No improvisation inside the code.
3. **The Examiner.** A testing rig. It gives an AI assistant a list of real tasks ("create a project card titled X", "find all my blocked items"), lets it work using a given toolset, then checks the results automatically: did it truly succeed, in how many steps, at what cost. Every task runs several times, because AI results vary, and scores are averaged.

The Examiner is the most valuable part. It turns opinions ("this looks good") into facts ("this succeeds 85 percent of the time, at half the cost").

## Who uses this, in concrete terms

Three products could be built on this project's engine. One is what
Phase 1 builds; two are candidate futures, chosen or not at the Phase 1
gate with Benchmark Report #1 in hand. Each is described below as a
single real user on a single day. Status is marked plainly so this
section is not mistaken for a promise.

### The Examiner — a quality gate for agent toolsets

**Status: this is what Phase 1 builds. Grounded in work already done.**

Sofia runs the platform team at a 40-person company. Their support agent
reaches an internal ticketing system through an MCP toolset built months
ago that nobody fully remembers. It mostly works, and every model update
makes the team nervous.

Her boss says the model they depend on is being retired; they switch next
Friday. Will the agent still work? Today the honest answer is "we'll find
out from customers."

Instead: she writes fifteen real tasks in plain files — "create a ticket
titled X for customer Y", "find all urgent open tickets" — each with an
automatic check for whether it truly happened. She runs one command
against today's model and gets numbers: how many succeeded, how many
steps each took, what it cost. Friday she runs the identical set against
the new model. The score drops, and the report names exactly which tasks
broke and shows each failed attempt. She fixes one confusing tool
description, reruns, the score recovers, and she ships the switch with a
before-and-after table. She now runs that twenty-minute check on every
model update and every API change.

Why she uses it: agents need to be re-checked constantly, and she had no
way to do it except in production. Checking is recurring; that is the
durable need.

### The refiner — turning a raw conversion into a good toolset

**Status: candidate for Phase 2. Not built. Decided at the Phase 1 gate.**

Marcus builds an AI assistant for dental clinics on top of a booking
system's API. On day one he runs an off-the-shelf converter, gets over a
hundred tools, wires them in, and the assistant is slow, wrong, and
expensive — it books the wrong slots and wastes money reading bloated
responses.

He points this tool at his setup. It reads the hundred-plus tools and the
API's documentation, then decides: it merges the booking endpoints into
one "book appointment" tool, drops the dozens of admin endpoints no
receptionist task needs, rewrites the descriptions so an AI picks the
right tool, and trims the responses. Out comes a 14-tool version. Then
the part that makes it more than a guess: the Examiner runs his tasks
against both the old and new versions and prints the difference — success
up, cost down, with the numbers attached. He ships the smaller version
knowing it is better, not hoping.

Why he uses it: anyone can ask an AI to prune a tool list, but he gets
proof the pruning helped, which he could not produce himself.

### The website examiner — can agents actually use your site

**Status: candidate future (PROJECT.md Future directions). Not built. The
harder surface; sequenced last on purpose.**

Amira manages an online shop. Agent-driven purchases are becoming a real
sales channel, and her CEO asks whether AI agents can actually buy from
their site. Nobody knows.

She enters the site's address and picks tasks from a menu: find a product
by a feature, add it to the cart, apply a discount code, check out as a
guest. Agents attempt each task repeatedly while everything is recorded.
The report: most tasks succeed, but checkout fails every time because the
discount field cannot be reached the way an agent navigates — with a
recording of the agent getting stuck. She files one fix, reruns,
checkout passes, and she schedules the check monthly so problems are
caught before they cost sales.

Why she uses it: agent-readiness is becoming what mobile-readiness once
was, and she cannot see her own site through an agent's eyes. This runs
on the same engine as Sofia's product, pointed at a harder surface with
no clean source of truth — which is why the plan builds the engine on a
controlled system first and turns to websites only once it is proven.

---

These three share one engine: real tasks, attempted repeatedly, recorded,
graded pass or fail against reality, compared over time. The project
builds that engine first. Which product it powers next is decided with
evidence, not conviction.

## How we prove it works

One comparison, repeated throughout the project. The same tasks, three toolsets:

| Toolset  | Made by                                                       |
| -------- | ------------------------------------------------------------- |
| Naive    | Automatic 1-to-1 conversion (today's common shortcut)         |
| Ours     | Our machine                                                   |
| Official | Human experts (the software company's own hand-built version) |

Beating "Naive" is expected early. The finish line is a small, honestly
measured gap to "Official" that shrinks with every improvement loop;
matching it is the stretch goal. Official toolsets carry years of product
knowledge, some never written down, so approaching them on public
information alone is already the result that matters.

## How this differs from existing agent benchmarks

Public benchmarks such as MCP-Bench, MCP-RADAR, and MCPEval measure the
model: given a fixed set of tools, how well does each LLM plan, pick,
and call them. The tools are held constant; the model is the variable.

AgentWorks measures the opposite axis. The model is pinned; the toolset
is the variable. Same tasks, same driver, different toolsets for the
same software — naive conversion, hand-curated, official, generated —
and the Examiner reports which toolset lets the same agent do the job
better, cheaper, and more reliably.

The two axes answer different questions. The model axis answers "which
model should I use." The toolset axis answers "is my integration any
good" — the question every team shipping tools for agents has, and the
one existing leaderboards don't address.

The engine underneath — real tasks, repeated attempts, recorded
transcripts, deterministic grading against reality — is deliberately
surface-agnostic: MCP toolsets first, other surfaces such as websites
later. Keeping that breadth is a standing design constraint: we build
for the axis, not for one target.

## Goals, in order

1. **Learning.** Master modern AI engineering by building, not just reading: how agents work, how AI quality is measured, how tools and context are designed. Every phase pairs building with selected reading.
2. **A public, credible artifact.** An open project plus a published write-up of the benchmark results. In this field, demonstrated measurement is worth more than any certificate.
3. **Business upside.** Companies run thousands of private software interfaces that will never receive expert-made toolsets. A machine that produces them automatically, with proof of quality, has real customers. Adjacent futures are listed near the end.

## The plan: five phases

Phases end when their exit test is passed, not when the calendar says so. Total expectation: roughly 4 to 5 months at 10+ hours per week.

### Phase 0. Foundations by hand (2 to 3 weeks)

Build a tiny AI agent completely from scratch, no frameworks, so its inner workings are fully understood. Hand-craft one small, excellent toolset for the chosen test software. Run an existing naive converter and study its weaknesses closely.

**Exit:** the hand-made toolset works inside a real AI assistant, and a written comparison characterizes, with evidence, how it differs from the naive conversion and what Phase 1 must measure.

### Phase 1. The measuring instrument (3 to 4 weeks)

Build the Examiner before the machine. Write 20 to 25 real tasks, each with an automatic pass/fail check (verified against reality, never by impression). Run the first three-way comparison: naive vs hand-made vs official.

**Exit:** Benchmark Report #1 exists, with real numbers.

### Phase 2. The design engine (4 to 6 weeks)

Build the Designer and the Builder. Feed in the manual and the docs, receive a designed toolset and generated code. From this point on, every improvement is judged by the Examiner's scores, not by taste.

**Exit:** the machine's toolset is benchmarked against all three others.

### Phase 3. The improvement loop (3 to 4 weeks)

Teach the system to learn from its own failures: every failed task is classified (wrong tool chosen, unclear description, missing capability) and fed back into the Designer automatically. Add a second software target to prove the machine generalizes beyond one case.

**Exit:** a report across two targets showing scores improving, loop after loop.

### Phase 4. Ship and tell (2 to 3 weeks)

Public release: a clean command-line tool anyone can run, and the essay: what happens when machine-designed toolsets face expert-made ones.

**Exit:** published.

## Working rules

- **Everything pinned.** Exact versions of every AI model and library are locked. Once a month, on "upgrade day", newer versions are tested by the Examiner and adopted only if the scores agree. Staying current through measurement, not hype.
- **Decision log.** Every meaningful choice gets one written line: what was decided, and why. Expensive mistakes come from forgotten assumptions, not from typos.
- **Protected learning time.** 1 to 2 hours weekly of reading, paired to the current phase.
- **Monthly market watch.** 30 minutes checking a short list of tripwires (kept in the decision log). If one fires, the roadmap is reviewed early, on schedule instead of on anxiety.

## What exists at the end

- A working tool: point it at a software interface, receive a quality toolset plus a scored report.
- A public benchmark and essay that others can inspect and repeat.
- A reusable engine (the Examiner) that powers every future direction below.
- The ability to demonstrate, with numbers, modern AI engineering skill.

## Future directions (parked on purpose)

- **The web version.** Described in full above as the website-examiner persona (Amira); see "Who uses this, in concrete terms."
- **A browser-standard output.** Emerging standards let websites offer tools to AI directly in the browser. Our Designer could produce those too: same engine, new body.
- **A testing service.** Companies adopting AI need continuous proof their setups still work after every model update. The Examiner is that product.
- **A public leaderboard.** Scoring the official toolsets of popular software: a reputation asset nobody can unpublish.

## Honest risks

- Large players will likely ship similar generators within a year; better-than-even odds. This is priced in: the measurement methodology, the published findings, and the skills survive regardless, and in developer tools several players usually coexist.
- The hard 80 percent is measurement quality, not code generation. Time is budgeted accordingly.
- The field moves monthly. That is exactly what the pinning, the upgrade day, and the tripwires are for.

## Confirmed decisions

1. **Test software target:** Shortcut, through a free workspace.
2. **Budget:** development rides the existing Claude subscription (Claude Code plus its monthly programmatic credit); a small pay-as-you-go API budget powers the measuring instrument itself.
3. **Repository visibility:** private until Phase 4, then published together with the essay.

## Small glossary

- **API:** the technical "front desk" of a software product; the way programs talk to it.
- **Agent:** an AI assistant that doesn't just answer, it acts, using tools.
- **MCP:** a common standard, think universal plug, for connecting AI assistants to software tools.
- **Toolset (MCP server):** the set of actions, with explanations, that an AI is given for one piece of software.
- **Benchmark / eval:** a repeatable test with scores; how AI quality gets measured instead of guessed.

---

_Week one starts with one small file: a tiny agent, built by hand._
