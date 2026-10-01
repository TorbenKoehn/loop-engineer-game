---
id: T042
epic: E004
title: "Fight nodes: build CombatInput and resolve"
summary: "travel to a fight node builds CombatInput from run state and content, calls resolveCombat without log, applies Trust and once-per-run flags, and enters combatReview."
keywords: ["run", "combat-input", "travel", "fight-node", "reducer"]
type: task
status: done
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

- [x] travel to a reachable fight node builds CombatInput with seed fork `combat/<nodeId>`, resolved defs, policy, encounter deadline and modifiers, and enters combatReview
- [x] travel to an unreachable node fails with notReachable
- [x] Trust and once-per-run flags carry over from the CombatResult (test)
- [x] The combat seed depends only on run seed and node id (fork-independence test)
- [x] continue from combatReview moves to the next mode

## Subtasks

- [x] Input builder
- [x] Outcome application
- [x] Mode transitions

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.
- 2026-10-01: `src/run/combat.ts` is the real content->CombatInput builder; T059 should switch the sandbox from `src/ui/sandbox/adapter.ts` to `combatInput` and delete the adapter.
- 2026-10-01: Built against the current CombatInput; if T025 adds context fields, `combatInput` must fill them. Not passed yet: harness trait rules (no CombatInput field), `OwnedTool.weightMod` (no ToolSetup field), lint rules (no content or FightModifier variant yet).
- 2026-10-01: continue goes to `map` after a win (T043 switches it to `reward`) and to `runEnd` after a loss (result and lessons: E008). `nextFight` is passed through unchanged; consuming it is T047. No new RunStats counters (E008 decides what the summary needs).

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
- 2026-10-01: AC1 verified: npx vitest run src/run/combat.test.ts "builds the CombatInput from run state and content and enters combatReview" (seed fork, defs, prompt, lessons, policy, deadline, modifiers) plus spawnDefs test (35 passed in src/run)
- 2026-10-01: AC2 verified: combat.test.ts "fails with notReachable for a node not adjacent to the current one"; apply.test.ts boss case
- 2026-10-01: AC3 verified: combat.test.ts "carries Trust and once-per-run flags over from the CombatResult" and "a loss clamps Trust at 0"
- 2026-10-01: AC4 verified: combat.test.ts "depends only on run seed and node id (fork independence)" (different harness, prompt, credits, Trust: same seed; distinct per node and run seed)
- 2026-10-01: AC5 verified: combat.test.ts "moves from combatReview to the map after a win", "a loss ... continue ends the run", "is rejected outside combatReview"
- 2026-10-01: production diff 143 lines (combat.ts 96 new, state/apply/actions/new-run 47); npm run check exit 0
- 2026-10-01: review requested
- 2026-10-01: integration fix after T055 merge; orchestrator-authorised
- 2026-10-01: done (R040)
