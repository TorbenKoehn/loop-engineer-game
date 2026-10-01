---
id: T021
epic: E002
title: Enemy intent cycles, action verbs and phase scaling
summary: "Enemy opening and cycle intents with windups, the action verbs hit, multiHit, throttle, slow, stun, guard, heal, spawn and a noise hook, the 5-enemy cap and phase scaling."
keywords: ["sim", "enemies", "intents", "verbs", "spawn", "phase-scaling"]
type: task
status: backlog
priority: p0
model: opus
size: M
depends_on: [T019, T020]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T021: Enemy intent cycles, action verbs and phase scaling

## Goal

Enemies telegraph and execute their intents on time, using only the documented verbs, so every enemy threat is visible and predictable.

## Context

- Epic: [E002](EPIC.md)
- [Combat: Enemy intents and phase scaling, Readability rule 1](../../../docs/game/systems/combat.md#enemy-intents-and-phase-scaling)
- [Statuses: Enemy action verbs](../../../docs/game/systems/statuses.md#enemy-action-verbs)
- [Event log: intentSet, enemyActed, spawn](../../../docs/architecture/event-log.md#event-kinds)
- Code: `src/sim/combat/enemies.ts`, `src/sim/combat/verbs.ts`
- Out of scope: Noise effect on the context bar (E003, here only a hook), redirect and custom verbs, traits (E007).

## Acceptance Criteria

- [ ] Test `intent cycle` resolves opening then cycle intents in order with intentSet and enemyActed events and progress reset
- [ ] Verbs hit, multiHit, throttle, slow, stun, guard, heal and spawn each have a test; noise(n) calls a context hook
- [ ] spawn respects its max and the 5-enemy cap, and dropped spawns are logged
- [ ] Test `phase scaling`: a homePhase-1 enemy in phase 2 has Severity x170/100 and damage x150/100 (floor)
- [ ] In the same tick the agent acts before enemies (test)

## Subtasks

- [ ] Intent progress and cycle
- [ ] Verb handlers
- [ ] Spawn insertion and cap
- [ ] Phase scaling constants

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
