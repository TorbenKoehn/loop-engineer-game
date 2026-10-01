---
title: Core loop
summary: The three nested loops of Loop Engineer (moment, run, meta), run flow, session lengths and decision-density targets.
keywords: [core-loop, run, meta, decision-density, pacing, flow]
type: gdd
status: active
updated: 2026-10-01
related: [vision.md, systems/combat.md, systems/run-map.md, systems/economy.md, systems/meta-progression.md]
---

# Core loop

Three nested loops. Decisions live in the outer two; the inner loop is the payoff.

## Moment loop: a fight (20–35 s at 1x)

1. The fight starts. The context bar fills to the **baseline** (loadout weight).
2. Tools charge left to right and fire when full. Each activation deals its effect and
   adds **output tokens** to Context. Pipes charge the neighbour.
3. Enemies show an **intent** (icon, value, countdown) and act when it completes.
4. Context crosses zones (Cold, Focused, Rot). At 100% the agent **auto-compacts**.
5. At the Deadline both sides take growing damage until someone falls.
6. The fight resolves to a log. The player watches, pauses, changes speed, reads the log.

Player inputs during a fight: pause, speed (1x/2x/4x/skip), scroll the log, hover for
tooltips. Nothing else. Details: [combat](systems/combat.md).

## Run loop: three phases (30–40 min)

```
Title -> Pick harness -> Pick system prompt (1 of 3)
  -> Phase 1 Implement: map of 7 rows + boss (Legacy Monolith)
  -> Phase 2 Test:      map of 7 rows + boss (The Flaky CI Pipeline)
  -> Phase 3 Deploy:    map of 7 rows + boss (Production Incident)
  -> Shipped! -> AGENTS.md lesson -> run summary -> (Endless loop, if unlocked)
On Trust 0 at any point: ^C -> AGENTS.md lesson -> run summary
```

At each map node the player picks one of the reachable nodes on the next row:

| Node | Loop beat |
|---|---|
| Task (fight) | Fight, then Credits + pick 1 of 3 rewards |
| Critical Bug (elite) | Harder fight, better rewards + a Memory |
| Package Registry (shop) | Buy, sell, reroll |
| Standup (event) | Text choice with a trade-off |
| Idle Cycle (rest) | Heal 30% Trust or upgrade a tool |
| Free Tier (treasure) | Gain a Memory |
| Release (boss) | Phase finale |

The **build panel** (loadout editor) is open at every non-fight moment: reorder tools,
swap with the stash, set the compaction policy. Map rules: [run-map](systems/run-map.md).
Economy: [economy](systems/economy.md).

## Meta loop: across runs

- Every run earns **Training Data**, spent in the unlock tree on new harnesses, tools,
  skills, memories, events and cosmetics. Unlocks widen choice; they never add raw power.
- After every run (win or loss) the player writes one **AGENTS.md lesson**: a persistent
  line with a small bonus against the enemy family that hurt most. It costs 1 token of
  baseline, like a real AGENTS.md costs context.
- **Lint rules** (ascension) and **Endless loop** extend the ceiling for experts.

Details: [meta-progression](systems/meta-progression.md) and
[endless and ascension](systems/endless-ascension.md).

## Session pacing targets

| Measure | Target | Tuning knob |
|---|---|---|
| Time to first build decision | ≤ 60 s from "New run" | number of intro screens |
| Fight length, normal | median 20–35 s at 1x | enemy Severity |
| Fight length, elite | median 30–45 s | elite Severity |
| Fight length, boss | median 40–60 s | boss Severity, stage timers |
| Phase length | 10–15 min | rows per phase (7) |
| Full run | 30–40 min | phases (3) |
| Decision interval | one meaningful decision every 20–40 s | node mix |

## Decision density per phase (check)

Route choices 7, reward picks about 4, shop decisions 5–10 (1–2 shops), events 1–2,
loadout tweaks about 6, one rest choice, one system prompt (phase 1 only). That is about
30 decisions per 12 minutes, one every 24 s, which meets the target.

## What the player learns, in order

1. Tools fire on their own; order matters (first fight).
2. The context bar has a sweet spot (tutorial pause at the first zone change).
3. Compaction costs tempo; the policy is a choice (first compaction).
4. Enemies telegraph; you counter them in the build, not in the fight (first elite).
5. Harness identity: lean and piped vs wide and safe (second run).

Onboarding flow: [onboarding](ux/onboarding.md).
