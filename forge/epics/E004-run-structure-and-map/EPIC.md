---
id: E004
title: Run structure and map
summary: "Pure run reducer in src/run for Phase 1: RunState, actions, seeded map, encounters, fight nodes, rewards with interest and pity, shop, rest, Free Tier, events, build actions (M1)."
keywords: ["run", "map", "reducer", "shop", "rewards", "events", "m1"]
type: epic
status: backlog
priority: p1
updated: 2026-10-01
related: ["../../../docs/architecture/run-state.md", "../../../docs/game/systems/run-map.md", "../../../docs/game/systems/economy.md", "../../../docs/game/systems/harness-loadout.md", "../../../docs/game/content/events.md", "../../../docs/game/vertical-slice.md"]
---

# E004: Run structure and map

## Goal

M1 vertical slice. After this epic a Phase-1 run can be played headless from harness pick to the boss through `apply(state, action)`: map, every node type, rewards, shop and build actions, all seeded by fork paths so UI, bots, tests and replays share one dispatch.

## Scope

- RunState, Action union, newRun/apply/legalActions/replay ([run state](../../../docs/architecture/run-state.md))
- Seeded 7×5 map with placement rules and encounter selection ([run and map](../../../docs/game/systems/run-map.md))
- Fight nodes building CombatInput and resolving via resolveCombat
- Credits, interest, 1-of-3 rewards with pity, shop with sale, reroll and sell ([economy](../../../docs/game/systems/economy.md))
- Idle Cycle, Free Tier, elite memory, the 4 M1 Standup events and next-fight modifiers
- Build actions (move, equip, unequip, swap, policy) and selectors for the UI ([loadout](../../../docs/game/systems/harness-loadout.md))

## Out of Scope

- Run end, meta state, lessons and saves (E008)
- Phases 2–3, phase transitions, Prune service, Endless (E012, E016)
- Any UI (E009); bots and balance (E010)

## Definition of Done

- [ ] All E004 tasks done with approved reviews
- [ ] Property test: legalActions only returns actions apply accepts, over random legal sequences
- [ ] replay(seed, actions) deep-equals the incrementally built state (test)
- [ ] A combat seed depends only on run seed and node id (fork-independence test)
- [ ] src/run line coverage ≥ 90%, branches ≥ 85%
