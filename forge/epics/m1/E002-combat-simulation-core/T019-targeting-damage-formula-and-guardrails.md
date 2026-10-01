---
id: T019
epic: E002
title: Targeting, damage formula and Guardrails
summary: "Target selectors front, back, lowest, all, self; the visible damage formula with flat and percent mods and why ids; Guardrails on agent and enemies; guard and heal effects."
keywords: ["sim", "targeting", "damage-formula", "guardrails", "heal", "why"]
type: task
status: done
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

- [x] Tests cover target selectors front, back, lowest (tie: frontmost), all (each hit separate) and self
- [x] Test `damage formula` checks `max(1, floor(((base + flat) * (100 + pct) + 50) / 100))` with the pct floor of -90 on at least 5 cases
- [x] Guardrails absorb before Trust or Severity, cap at max Trust or max Severity, and overkill is discarded (tests)
- [x] damage events carry base, flat, pct, guard and why ids in application order
- [x] guard and heal effects use the same formula and emit guard and heal events

## Subtasks

- [x] Selectors
- [x] Formula with why list
- [x] Guardrails absorb and cap
- [x] guard and heal effects

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.
- 2026-10-01: Design: `computeAmount(base, mods)` in damage.ts returns base, flat, pct (sum of % mods, floored at -90), amount and why (flat mod ids first, then % mod ids). Tool activations pass no mods yet (item mods T033, zone T025). Damage `v`, guard `v` and heal `v` are the amounts actually applied (after Guardrails absorb, overkill and caps); `d.guard` is the part Guardrails absorbed, `d.total` the new Guardrails or Trust/Severity.
- 2026-10-01: guard and heal effects from tools always land on the agent; a dmg effect uses `effect.target ?? tool.target`, so `self` dmg is self-damage. `rightTool`/`tools` select no combat target. Enemy hits go through the same `dealDamage`; `gainGuard`/`heal` take any unit, ready for the T021 enemy verbs.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
- 2026-10-01: AC1 verified: npx vitest run src/sim/combat/targeting.test.ts (8 passed: front, back, lowest tie frontmost, all front to back, self; fight tests for back and all with per-enemy overkill)
- 2026-10-01: AC2 verified: `damage formula` in src/sim/combat/damage.test.ts, 8 cases incl. -120 floored at -90, round half up, min 1 (12 passed in file)
- 2026-10-01: AC3 verified: damage.test.ts `Guardrails` (absorb before Severity and Trust, overkill discarded on enemy and agent) and effects.test.ts caps at max Trust 40 and max Severity 30
- 2026-10-01: AC4 verified: damage.test.ts `absorb before Severity` asserts the full event: base 8, flat 2, pct 20, guard 4, why ['skill:x', 'zone:focused'] (flat before %)
- 2026-10-01: AC5 verified: npx vitest run src/sim/combat/effects.test.ts (5 passed: guard and heal events in a fight, % and flat mods through computeAmount)
- 2026-10-01: npm run check exit 0 (184 tests, sim lines 97.93%, harness 0 errors); production diff 195 lines
- 2026-10-01: review requested
- 2026-10-01: done (R019)
