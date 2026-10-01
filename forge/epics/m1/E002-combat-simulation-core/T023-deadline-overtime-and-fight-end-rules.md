---
id: T023
epic: E002
title: Deadline overtime and fight-end rules
summary: "Deadline damage k per second after deadlineMs to enemies then agent, bypassing Guardrails; the timeout cap; death checks with ties to the player; agentAfter carry-over."
keywords: ["sim", "deadline", "overtime", "fight-end", "timeout"]
type: task
status: in-progress
priority: p1
model: opus
size: S
depends_on: [T019]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T023: Deadline overtime and fight-end rules

## Goal

Every fight ends: overtime damage grows each second after the Deadline and a hard cap guarantees termination, while ties favour the player.

## Context

- Epic: [E002](EPIC.md)
- [Combat: Deadline and fight end, Tick order steps 7-8](../../../../docs/game/systems/combat.md#deadline-and-fight-end)
- [Simulation core: API (CombatResult)](../../../../docs/architecture/sim-core.md#api)
- Code: `src/sim/combat/deadline.ts`, `src/sim/combat/end.ts`
- Out of scope: Error Budget memory (E014), Deadline UI (E006), armor bypass (checked again in E007).

## Acceptance Criteria

- [ ] Test `deadline damage` deals k to every enemy then k to the agent at each full second k after deadlineMs, bypassing Guardrails
- [ ] A fight reaching deadlineMs + 30 000 ends with outcome loss, reason timeout
- [ ] When all enemies and the agent drop to 0 in the same tick the outcome is win (test)
- [ ] `CombatResult.agentAfter` carries Trust and maxTrust; Guardrails and statuses are not carried

## Subtasks

- [ ] Deadline step
- [ ] Timeout cap
- [ ] Death-check order

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
