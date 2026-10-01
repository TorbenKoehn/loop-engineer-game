---
title: Loop Engineer design proposal
summary: Pillars, core loops, harness system, context mechanic, enemy roster, meta-progression and a minimal vertical-slice scope for Loop Engineer.
keywords: [game-design, pillars, core-loop, harness, enemies, vertical-slice, context-mechanic]
type: research
status: active
updated: 2026-10-01
related: [game-design-references.md, tech-stack.md, ../../../CONCEPT.md, game-design-proposal-content.md]
---

# Loop Engineer: design proposal

## Contents
- 1. Elevator pitch
- 2. Design pillars
- 3. Glossary (game terms to UI)
- 4. Core loops
- 5. Context mechanic: "Sweet-Spot Window" (Variant A)
- 6-8. Harness classes, enemy roster, decision density
- 9. Vertical slice (minimal, proves the fun)
- 10. Open questions for the user

Status: a proposal for the orchestrator and the user to accept or change. All numbers
are first guesses that the balance sim will tune.

## 1. Elevator pitch

You are an AI agent stuck in the engineering loop. Pick a **Harness**, fill your
context window with tools, and watch your build fight its way through a sprint of
bugs, rate limits and stakeholders. The hard part isn't the bugs, it's your own
**context**. Too little and you hallucinate, too much and you rot.

## 2. Design pillars

1. **Plan, then watch it run.** All decisions happen between fights (route, shop,
   tool order, policies). Combat is a deterministic, readable replay of those
   decisions. If you lose, the log should tell you why.
2. **Context is the tension.** One bar with a sweet spot. Every bit of power has a
   token cost. Enemies attack your attention as well as your health.
3. **Satire you don't need a CS degree for.** The jokes are flavour. The mechanics are
   plain verbs (damage, shield, slow, freeze). Every dev joke has a plain-English
   tooltip line.
4. **Seeded, telegraphed, fair.** Same seed gives the same run. Enemies show their
   next move. There are no hidden dice rolls in combat results. This also makes the
   game testable by AI agents.

Anti-pillars (things we won't do): real-time micro control, PvP, art-heavy content,
lore dumps, permanent stat grinding.

## 3. Glossary (game terms to UI)

| Concept | In-game name | Plain meaning |
|---|---|---|
| Player HP | **Trust** | The human's trust in you. At 0 they hit Ctrl+C and the run ends |
| Enemy HP | **Severity** | How much work is left. Reduce it to 0 to resolve the enemy |
| Context resource | **Context** (tokens) | See section 5 |
| Gold | **Credits** | API credits, earned per node, spent in the Registry |
| Block | **Guardrails** | A shield absorbed before Trust |
| Act | **Phase** | Implement -> Test -> Deploy |
| Ascension | **Lint rules** | Opt-in difficulty modifiers |

## 4. Core loops

### Moment-to-moment (combat, 15–40 s at 1x)
- Layout: one lane. The **Agent** is on the left, with Trust, Guardrails, the context
  bar, and a row of 4–8 **tool slots**, each with a cooldown bar. **Enemies** are on the
  right, 1–4 in a line, each showing Severity and an **intent** (icon + countdown).
- Tools fire automatically when their cooldown completes. Ties resolve left to right.
  Each activation adds output tokens to Context.
- Enemies act on their telegraphed timers.
- At 45 s **Deadline** starts: both sides take damage that grows every second.
- Player controls: pause, speed (1x/2x/4x/skip), and the combat log. No other
  in-combat input, which keeps combat a pure function of its inputs.

### Run (20–40 min, 3 phases x ~8 nodes)
- StS-style branching map per phase, 7 rows. Node types:
  - **Task** (normal fight)
  - **Critical Bug** (elite, from row 3 onward)
  - **Package Registry** (shop)
  - **Standup** (text event)
  - **Idle Cycle** (rest: restore 30% Trust *or* bump one tool's version)
  - **Free Tier** (treasure: memory item)
  - **Release** (boss)
- After a fight: Credits, plus pick **1 of 3** rewards (tool/skill), or skip for +Credits.
- **Shop:** 5 offers, reroll for 2 credits (+1 per reroll), sell for half price.
  Interest: +1 credit per 10 held, max +3 (TFT).
- **Build phase** (available at any non-fight node): reorder tools, swap equipment from
  the **stash** (4 slots), and set **policies**.
- Phases: **1 Implement** (boss: Legacy Monolith), **2 Test** (boss: The Flaky CI
  Pipeline), **3 Deploy** (boss: Production Incident). Winning shows "Shipped!" and
  then the loop starts over at a higher lint level (the loop is the joke).

### Meta (across runs)
- **Training Data** (meta currency) is earned per node and per boss. Spend it to
  **unlock** new tools, skills and harnesses into the pool. Sidegrades only, never flat stats (Hades keys).
- **AGENTS.md**: after each run you write one line, chosen from 3 "lessons" that match
  what beat you ("Always check rate limits"). It is a persistent memory item with a
  small bonus against that enemy family. Max 3 lines; to add a 4th, replace one. It is
  thematic, bounded, and turns a loss into progress.
- **Lint rules** (ascension, à la carte, each worth points): `max-context-64k`,
  `rate-limit-strict`, `no-internet`, `flaky-ci`, `scope-creep-always`, `no-undo`...
  Higher totals raise the Training Data multiplier.
- **Daily seed**: same seed and rules for everyone, with a local leaderboard.

## 5. Context mechanic: "Sweet-Spot Window" (Variant A)

Derivation and alternatives are in game-design-references.md section 4.

- `window`: set by the harness model (60 / 100 / 160 tokens, shown as 60k/100k/160k).
- **Baseline** at the start of a fight = the sum of the token weights of the system
  prompt, tools, skills and memories.
  Example: system prompt 10, `grep` 3, `edit_file` 5, `run_tests` 6, skill
  `Concise` 4. Baseline = 28 of 100.
- **Outputs**: every tool activation adds tokens (`grep` +2, `read_file` +8).
- **Noise**: tokens injected by enemies. Shown as grey segments. Noise counts toward
  fill but makes no contribution to *Focus* effects.
- **Zones** (shown as colours on the bar):
  - `Cold` <25%: tools have a 20% "guess" chance to deal half damage, using a seeded
    roll that is shown in the log.
  - `Focused` 25–70%: +20% tool effects.
  - `Rot` 70–100%: cooldowns tick 30% slower, and noise from enemies is doubled.
  - `Overflow` at 100%: **auto-compaction**. A 2 s stun with a full-screen
    "Compacting conversation…" moment. Fill resets to baseline + 10, noise is cleared,
    and you lose your most recent temporary buff.
- **Compaction policy** (build phase): `compact at [70|80|90]%` or `never`. A planned
  compaction stuns for only 1 s and keeps buffs. Decision: compact early and often
  (lose tempo) or ride the Rot zone.
- Items that bend the rules: `Concise` (-1 output per tool), `Summarizer` (on
  compaction gain Guardrails), `Brute Force` (damage scales with fill %), `Long Context`
  (+40 window, cooldowns +10%), `.gitignore` (blocks the first 10 noise per fight).

## 6-8. Harness classes, enemy roster, decision density

Moved to [game-design-proposal-content.md](game-design-proposal-content.md).

## 9. Vertical slice (minimal, proves the fun)

**Goal:** one 10–15 minute run (Phase 1 only) that shows the context bar is
readable and the harness choice matters. Every system is built "for real" and the
content is thin.

| Area | In scope | Out of scope |
|---|---|---|
| Harnesses | 2 (Terminal Purist, IDE Copilot), 3 system prompts | Swarm, YOLO |
| Map | Phase 1 only: 7 rows, all 7 node types, StS placement rules | Phases 2–3 |
| Combat | Full sim: cooldowns, intents, 6 statuses (Noise, Throttle, Haste, Slow, Guardrails, Stun), Deadline, pipes | Multi-lane, summons |
| Context | Full Variant A: baseline, outputs, noise, zones, overflow, compaction policy | Lint rules modifying it |
| Content | 12 tools, 8 skills, 4 memories, 6 enemies (Typo, Context Drift, Rate Limit, Dependency Hell, Scope Creep, 503), 1 elite (Yak Shave), boss Legacy Monolith, 4 events | Remaining roster |
| Economy | Credits, shop, reroll, sell, interest, 1-of-3 rewards, version bumps | Evolutions |
| Meta | Run history plus AGENTS.md (1 line), 1 unlockable tool | Training Data tree, lint rules, daily seed |
| UX | Combat log, speed 1x/2x/4x/skip, pause, hover tooltips with plain-English line, a tutorial fight | Settings beyond volume/reduced motion |
| Juice | Number pops, shake, hit-stop, typed text, zone-change flash, zzfx sounds, CRT toggle | Music |
| Persistence | Auto-save between nodes, export/import save string | Cloud saves |
| Tooling | Headless balance sim CLI (1000 bot runs, win rate per item/enemy), seed replay, Playwright smoke run | Analytics |

**Exit criteria for the slice:**
1. A full Phase 1 run is winnable by both harnesses. Bot win rate is 35–65% with a greedy bot.
2. No tool appears in >40% of winning bot loadouts (no single dominant item).
3. 3 of 5 human testers can explain the context bar after the tutorial fight without help.
4. Same seed + same inputs produce a byte-identical combat log (CI-tested).
5. Median fight length is 20–35 s at 1x.

## 10. Open questions for the user

1. Is "Trust" (the human's trust) the right fantasy for HP, or should it be something like "Budget"?
2. Should the loop restart after Deploy (endless, increasing lint level) or should runs end at "Shipped"?
3. How strong should the satire be? Should it name real products (Claude, Copilot, Jira) or stay generic?
4. Is the AGENTS.md between-run memory a good fit for the "own harness" idea in CONCEPT.md?
