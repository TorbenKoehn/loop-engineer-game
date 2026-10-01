---
id: T019
epic: E002
title: Targeting, damage formula and Guardrails
summary: "Target selectors front, back, lowest, all, self; the visible damage formula with flat and percent mods and why ids; Guardrails on agent and enemies; guard and heal effects."
keywords: ["sim", "targeting", "damage-formula", "guardrails", "heal", "why"]
type: task
status: in-progress
priority: p0
model: opus
size: M
depends_on: [T018]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T019: Targeting, damage formula and Guardrails

## Goal

Implement the one visible damage formula and the targeting rules so every hit is computed exactly as the tooltip will show it.

## Context

- Epic: [E002](EPIC.md)
- [Combat: Targeting, Damage formula](../../../../docs/game/systems/combat.md#damage-formula)
- [Statuses: Guardrails row](../../../../docs/game/systems/statuses.md#the-six-statuses)
- [Event log: damage, guard, heal payloads](../../../../docs/architecture/event-log.md#event-kinds)
- Code: `src/sim/combat/targeting.ts`, `src/sim/combat/damage.ts`, `src/sim/combat/effects.ts`
- Out of scope: Zone percentages (E003), armor, Outage and Blocked (E007), Decoy and Elusive (E012), item modifiers (E007).

## Acceptance Criteria

- [ ] Tests cover target selectors front, back, lowest (tie: frontmost), all (each hit separate) and self
- [ ] Test `damage formula` checks `max(1, floor(((base + flat) * (100 + pct) + 50) / 100))` with the pct floor of -90 on at least 5 cases
- [ ] Guardrails absorb before Trust or Severity, cap at max Trust or max Severity, and overkill is discarded (tests)
- [ ] damage events carry base, flat, pct, guard and why ids in application order
- [ ] guard and heal effects use the same formula and emit guard and heal events

## Subtasks

- [ ] Selectors
- [ ] Formula with why list
- [ ] Guardrails absorb and cap
- [ ] guard and heal effects

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
