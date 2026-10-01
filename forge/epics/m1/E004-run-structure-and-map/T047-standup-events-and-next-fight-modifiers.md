---
id: T047
epic: E004
title: Standup events and next-fight modifiers
summary: "Standup nodes draw an unseen phase-1 event, every M1 choice applies its exact outcome including 50% rolls, unmet requirements are illegal, and next-fight modifiers reach CombatInput."
keywords: ["events", "standup", "modifiers", "choices", "run"]
type: task
status: backlog
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

- [ ] A Standup draws one unseen M1 event allowed in phase 1 via `event/<nodeId>`
- [ ] Each choice of the 4 M1 events has a reducer test with the exact outcome, including underflow_answer's 50% roll
- [ ] Choices with unmet requirements are illegal and expose a reason for the UI
- [ ] addEnemy appends at the back for its remaining fights; startNoise and startSignal reach the next CombatInput (tests)

## Subtasks

- [ ] Event draw
- [ ] Choice outcomes
- [ ] Requirements
- [ ] Modifier application

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
