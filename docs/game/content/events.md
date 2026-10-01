---
title: Standup events
summary: All 16 Standup events with phase availability, unlock flags, setup text and exact choice outcomes; marks the 4 vertical-slice events.
keywords: [content, events, standup, choices, satire, trade-offs]
type: gdd
status: active
updated: 2026-10-01
related: [../systems/run-map.md, ../systems/economy.md, tools.md, memories-lessons.md]
---

# Standup events

Rules:

- A Standup draws one event allowed in the current phase, excluding events seen this run
  and `unlock` events not yet unlocked. RNG: `fork(runSeed, 'event/' + nodeId)`.
- Setup text: at most 3 lines. Every choice shows its exact outcome in plain English
  before the click (no hidden results except declared 50% rolls, shown as "50%:").
- Choices with unmet requirements (credits, tags) are shown disabled with the reason.
- "Next fight" modifiers are stored in run state and apply to the next Task, elite or boss.
- "Random tool" means uniform over owned tools matching the filter, via the event RNG.

## Catalogue

| Id | Phases | Flags | Setup | Choices and exact outcomes |
|---|---|---|---|---|
| `quick_tiny_change` | 1–3 | M1 | The PM: "Can you make a quick tiny change? Shouldn't take long." | **Sure!** +25 Credits; your next 2 Tasks add a Scope Creep at the back. **Ask for a ticket:** nothing |
| `pasted_log` | 1–3 | M1 | The user pastes a 4000-line log. "Something is wrong." | **Read all of it:** your leftmost [Search] tool +1 version (none: gain `grep`); next fight starts with +20 noise. **Ask for the relevant part:** +8 Credits |
| `underflow_answer` | 1–2 | M1 | A Stack Underflow answer from 2011 has 3000 upvotes. | **Copy it:** gain a random uncommon tool; 50%: also lose 8 Trust ("it segfaulted"). **Read the comments:** +5 Credits |
| `green_locally` | 1–3 | M1 | "The tests are green locally." | **Ship it:** restore 20 Trust. **Set up CI properly** (15 Credits): +1 memory slot. **Write one more test** (needs an equipped [Test] tool): your leftmost [Test] tool +1 version |
| `rewrite_language` | 2–3 | | "Should we rewrite everything in a new language?" | **Yes:** delete your leftmost tool; your rightmost tool +1 version. **No:** nothing |
| `conference_talk` | 2–3 | | A conference invites you to give a talk. | **Go** (20 Credits): gain a random uncommon or rare skill. **Decline:** nothing |
| `security_training` | 2–3 | | Mandatory security training, 4 hours, 212 slides. | **Sit through it:** +6 max Trust and restore 6 Trust. **Skip it:** +10 Credits; next fight adds a Permission Denied at the back |
| `intern_pr` | 1–3 | | The intern's PR changes 2000 lines. | **Review carefully:** a random tool below v3 +1 version; next fight starts with +15 noise. **LGTM:** +15 Credits; lose 8 Trust |
| `pair_with_senior` | 2–3 | | A senior engineer offers to pair. | **Accept:** move 1 version from one tool (≥ v2) to another (≤ v2), both chosen. **Decline politely:** +5 Credits |
| `prompt_workshop` | 2 | | Prompt engineering workshop, free pizza. | **Attend** (15 Credits): replace your system prompt with one of 2 other unlocked prompts. **Skip:** nothing |
| `legacy_wiki` | 1 | | You find a wiki page last edited 9 years ago. | **Read it:** next fight starts with +12 signal and your [Search] tools get +20% in it. **Close the tab:** +4 Credits |
| `rollback_drill` | 3 | | Rollback drill at 4 PM on a Friday. | **Participate:** restore 25 Trust, lose 15 Credits (min 0). **Skip:** nothing |
| `hackathon` | 1–3 | unlock | Weekend hackathon. Pizza, again. | **Join:** gain a random rare tool; lose 15 Trust. **Sleep:** restore 10 Trust |
| `dependency_bot` | 1–2 | unlock | The dependency bot opened 47 PRs overnight. | **Merge all:** a random tool below v3 +1 version; 50%: a different random tool above v1 −1 version. **Close all:** nothing |
| `coffee_machine` | 1–3 | unlock | The coffee machine is broken. | **Fix it** (10 Credits): gain Coffee Mug (owned: +10 Credits back). **Suffer:** lose 5 Trust |
| `on_call_handover` | 3 | unlock | "You're on call this week, right?" | **Take the pager:** gain On-call Pager (owned: +15 Credits); next fight adds 2 Thundering Herd at the back. **Pass it on:** lose 6 Trust |

Totals: 16 events; 4 in M1, 12 added in M2; 4 behind the "Office politics" unlock.

## Writing rules for new events

1. One situation every developer recognises, in one sentence.
2. Two or three choices; at least one must be "safe" (nothing or a small gain).
3. Every outcome uses existing verbs: Credits, Trust, max Trust, version ±1, gain item,
   next-fight modifier (noise, signal, extra enemy, % bonus), memory slot.
4. No real product, company or person names (see [vision](../vision.md)).
5. Each new event needs a unit test for each choice in the run reducer.

## Next-fight modifiers (data)

| Modifier | Fields | Applied at |
|---|---|---|
| `addEnemy` | enemy id, count, fights remaining | encounter spawn, at the back |
| `startNoise` | tokens | fight start, through blockers |
| `startSignal` | tokens | fight start |
| `tagBonus` | tag, pct | damage formula for that fight |
