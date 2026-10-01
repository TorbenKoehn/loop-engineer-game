---
id: T042
epic: E004
title: "Fight nodes: build CombatInput and resolve"
summary: "travel to a fight node builds CombatInput from run state and content, calls resolveCombat without log, applies Trust and once-per-run flags, and enters combatReview."
keywords: ["run", "combat-input", "travel", "fight-node", "reducer"]
type: task
status: in-progress
priority: p1
model: opus
size: M
depends_on: [T041, T018]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T042: Fight nodes: build CombatInput and resolve

## Goal

Connect the run to the sim: fights are resolved inside the reducer, so bots, tests and the UI all get the same outcome.

## Context

- Epic: [E004](EPIC.md)
- [Run state: Actions (travel), RNG fork paths](../../../../docs/architecture/run-state.md#actions)
- [Simulation core: API](../../../../docs/architecture/sim-core.md#api)
- [Run and map: Node types](../../../../docs/game/systems/run-map.md#node-types)
- Code: `src/run/apply.ts`, `src/run/combat.ts`
- Out of scope: Rewards after the fight (next task), run end (E008), playback (E006).

## Acceptance Criteria

- [ ] travel to a reachable fight node builds CombatInput with seed fork `combat/<nodeId>`, resolved defs, policy, encounter deadline and modifiers, and enters combatReview
- [ ] travel to an unreachable node fails with notReachable
- [ ] Trust and once-per-run flags carry over from the CombatResult (test)
- [ ] The combat seed depends only on run seed and node id (fork-independence test)
- [ ] continue from combatReview moves to the next mode

## Subtasks

- [ ] Input builder
- [ ] Outcome application
- [ ] Mode transitions

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
