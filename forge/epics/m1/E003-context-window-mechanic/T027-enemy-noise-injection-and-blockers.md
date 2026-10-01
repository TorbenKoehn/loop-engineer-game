---
id: T027
epic: E003
title: Enemy noise injection and blockers
summary: "The noise verb with phase noise scale, Rot doubling and per-fight blockers, plus startNoise and startSignal fight modifiers applied at fight start."
keywords: ["context", "noise", "blockers", "gitignore", "modifiers"]
type: task
status: in-progress
priority: p1
model: opus
size: S
depends_on: [T025, T021]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T027: Enemy noise injection and blockers

## Goal

Enemies fill the context with noise, the main pressure of Context Drift and the boss, with blockers and event modifiers working as documented.

## Context

- Epic: [E003](EPIC.md)
- [Context: Noise, Quantities (fight start)](../../../../docs/game/systems/context.md#noise)
- [Events: Next-fight modifiers](../../../../docs/game/content/events.md#next-fight-modifiers-data)
- Code: `src/sim/combat/context.ts`, `src/sim/combat/verbs.ts`
- Out of scope: Context lesson -25% (E007), noise source labels in the UI (E006).

## Acceptance Criteria

- [ ] Test `noise verb` applies n x phaseNoiseScale / 100, then x2 in Rot, then subtracts blockers, then N += n' with a tokens event of kind noise and the enemy ref
- [ ] Test `blocker budget per fight`: a 12-token blocker absorbs only the first 12 noise across several injections
- [ ] startNoise and startSignal modifiers apply at fight start through blockers, then the overflow check runs once

## Subtasks

- [ ] Noise verb
- [ ] Blocker budget
- [ ] Fight-start modifiers

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
