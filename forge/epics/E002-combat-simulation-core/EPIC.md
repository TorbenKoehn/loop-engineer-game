---
id: E002
title: Combat simulation core
summary: "Pure integer resolveCombat in src/sim: 50 ms tick order, charge rates, targeting, damage formula, statuses, intents, pipes, primes, Deadline, determinism tests (M1)."
keywords: ["combat", "simulation", "tick", "damage-formula", "statuses", "determinism", "m1"]
type: epic
status: backlog
priority: p0
updated: 2026-10-01
related: ["../../../docs/architecture/sim-core.md", "../../../docs/architecture/event-log.md", "../../../docs/game/systems/combat.md", "../../../docs/game/systems/statuses.md", "../../../docs/game/vertical-slice.md"]
---

# E002: Combat simulation core

## Goal

M1 vertical slice. After this epic a developer can call `resolveCombat(input)` with a loadout and an encounter and get a deterministic outcome plus an event log that explains every number, following the tick order and formulas in the combat GDD. Item rules, enemy traits and bosses build on it (E007); the context bar plugs into it (E003).

## Scope

- Integer helpers `src/sim/int.ts` and sim test builders ([sim core](../../../docs/architecture/sim-core.md))
- Tick loop, charge and fire, win/loss, `CombatInput`/`CombatResult` API ([combat: tick order](../../../docs/game/systems/combat.md))
- Targeting (front, back, lowest, all, self), damage formula, Guardrails, guard and heal effects
- Statuses Haste, Slow, Throttle, Stun with stacking and selectors ([statuses](../../../docs/game/systems/statuses.md))
- Enemy intent cycles, action verbs (no redirect), phase scaling, spawn cap of 5
- Pipes and one-shot primes; Deadline overtime and timeout
- Event log per [event log](../../../docs/architecture/event-log.md); determinism property tests and 5 reference golden fights

## Out of Scope

- Context bar maths, outputs, noise and compaction (E003)
- Rule engine, item modifiers, harness traits, breakpoints, enemy traits and boss handlers (E007)
- Decoy, Elusive, redirect, sub-agents and other M2 mechanics (E012, E013)
- Fast-forward optimisation (E010) and any rendering (E006)

## Definition of Done

- [ ] All E002 tasks done with approved reviews
- [ ] Property test "same input twice gives identical logs" passes on 200 random inputs
- [ ] tests/golden holds 5 reference fights as canonical JSONL with hashes, green in `npm test`
- [ ] src/sim line coverage ≥ 95% (vertical-slice exit criterion 7)
- [ ] Architecture test confirms src/sim imports only src/sim and src/content/types
