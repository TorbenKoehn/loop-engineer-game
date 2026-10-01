---
id: E004
title: Run structure and map
summary: "Run layer in the sim: seeded StS-style map per phase, node types, run reducer over serializable actions, shop, rewards, rest and events, plus seed and action-log saves."
keywords: ["run", "map", "reducer", "shop", "rewards", "save-system"]
type: epic
status: backlog
priority: p1
updated: 2026-10-01
related: ["../../../docs/research/game/game-design-proposal.md", "../../../docs/research/game/tech-stack.md"]
---

# E004: Run structure and map

## Goal

Provide the 3-phase run loop as a pure reducer (RunState, Action) so UI, bots, tests and replays share one dispatch, with saves stored as seed plus action log.

## Scope

- Seeded map generation with placement rules (7 rows, branching)
- Node types: Task, Critical Bug, Registry, Standup, Idle Cycle, Free Tier, Release
- Run reducer, rewards (pick 1 of 3), shop with reroll, sell and interest
- Build phase: tool order, stash, policies
- Per-node RNG forks
- Versioned save format (seed + action log) with replay

## Out of Scope

- Meta-progression, AGENTS.md and daily seed
- Map and shop UI (E006)
- Content volume beyond the slice (E005)

## Definition of Done

- [ ] A full run can be played headless by a bot to Release or defeat
- [ ] Same seed and actions reproduce the same RunState
- [ ] Changing shop choices does not change later map or fight RNG
- [ ] Save round-trip test passes
