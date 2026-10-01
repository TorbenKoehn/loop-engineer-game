---
id: T047
epic: E004
title: Standup events and next-fight modifiers
summary: "Standup nodes draw an unseen phase-1 event, every M1 choice applies its exact outcome including 50% rolls, unmet requirements are illegal, and next-fight modifiers reach CombatInput."
keywords: ["events", "standup", "modifiers", "choices", "run"]
type: task
status: done
priority: p2
model: opus
size: M
depends_on: [T042, T015, T027]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T047: Standup events and next-fight modifiers

## Goal

Events add small, readable decisions whose outcomes are exactly what the buttons say.

## Context

- Epic: [E004](EPIC.md)
- [Events: Rules, M1 catalogue rows, Next-fight modifiers](../../../../docs/game/content/events.md)
- [Run and map: Events](../../../../docs/game/systems/run-map.md#events)
- Code: `src/run/events.ts`
- Out of scope: M2 events and unlock-flagged events (E014), event screen (E009).

## Acceptance Criteria

- [x] A Standup draws one unseen M1 event allowed in phase 1 via `event/<nodeId>`
- [x] Each choice of the 4 M1 events has a reducer test with the exact outcome, including underflow_answer's 50% roll
- [x] Choices with unmet requirements are illegal and expose a reason for the UI
- [x] addEnemy appends at the back for its remaining fights; startNoise and startSignal reach the next CombatInput (tests)

## Subtasks

- [x] Event draw
- [x] Choice outcomes
- [x] Requirements
- [x] Modifier application

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.
- 2026-10-01: Code lives in src/run/events/ (src/run is at 14 of 15 files). Seen events are a new RunState field `seenEvents`; the event pending stores the serialised `event/<nodeId>` RNG after the draw, so rolls continue that fork. Trust 0 after a choice ends the run as ctrlc. addEnemy is applied by the run (appended to the encounter line) and filtered out of CombatInput.modifiers; startNoise/startSignal/tagBonus pass to the sim once. `chooseEvent` has no `pick` yet (needed only by M2 'chosen' picks; unsupported verbs throw).
- 2026-10-01: harness:check was red only because of a pre-existing R066-T024 summary-length error. The orchestrator fixed it on main; tsc, biome and vitest are green and no lint error comes from T047 files.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
- 2026-10-01: AC1 verified: npx vitest run src/run/events (21 passed): standup.test.ts "Standup draw" (pick from fork event/<nodeId> over the phase pool, seen and phase filters, empty pool stays on map)
- 2026-10-01: AC2 verified: standup.test.ts describes quick_tiny_change, pasted_log (incl. no-Search fallback grep), underflow_answer (12 seeds, both roll branches asserted against the event RNG; Trust 0 -> ctrlc), green_locally: one test per choice
- 2026-10-01: AC3 verified: standup.test.ts "choice requirements": eventChoices exposes insufficientCredits/missingTag, legalActions omits them, apply rejects with those errors
- 2026-10-01: AC4 verified: modifiers.test.ts: addEnemy at the back for 2 fights then expires; startNoise/startSignal in CombatInput.modifiers via travel and spent; pasted_log choice reaches the next fight through the reducer
- 2026-10-01: checks: tsc 0, biome 0 (1 pre-existing warning), vitest green, harness:check exit 1 (pre-existing R066 error only); harness:diff production=230 total=535
- 2026-10-01: blocked: harness:check red on the pre-existing R066-T024 summary length (outside allowed paths)
- 2026-10-01: unblocked (R066 fixed on main by the orchestrator); review requested
- 2026-10-01: done (R068)
