---
id: T018
epic: E002
title: "Combat walking skeleton: one tool vs one enemy"
summary: "resolveCombat(input) with the 50 ms tick loop, charge and fire, single-target damage, a hit intent, win and loss, the core events, and sim test builders."
keywords: ["sim", "combat", "tick", "walking-skeleton", "resolve-combat", "events"]
type: task
status: backlog
priority: p0
model: opus
size: M
depends_on: [T003, T004, T017, T009]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T018: Combat walking skeleton: one tool vs one enemy

## Goal

Prove the whole sim path end to end with the thinnest slice: a CombatInput goes in, ticks run in the documented order, and a CombatResult with an event log comes out. Every later combat task extends this.

## Context

- Epic: [E002](EPIC.md)
- [Simulation core: API, Entities, Tick model](../../../docs/architecture/sim-core.md)
- [Combat: Tick order](../../../docs/game/systems/combat.md#tick-order)
- [Event log: Event shape, Ordering](../../../docs/architecture/event-log.md)
- [Testing: Rules for agents writing tests](../../../docs/architecture/testing.md#rules-for-agents-writing-tests)
- Code: `src/sim/combat/`, `src/sim/testing/`
- Out of scope: Statuses, pipes, context bar, Deadline, traits, rule engine, fast-forward.

## Acceptance Criteria

- [ ] Test `one grep kills one Typo` ends with outcome win, reason resolved, and toolFired events every 3000 ms at rate 100
- [ ] Test `agent loses to an unbeatable enemy` ends with outcome loss, reason trust
- [ ] Events follow event-log.md: seq strictly increasing from 0, t a multiple of 50, fightStart first, fightEnd last
- [ ] `resolveCombat(input, { log: false })` returns the same outcome and endT with an empty events array
- [ ] Builders makeTool, makeEnemy and fight() exist in `src/sim/testing` and the tests use them

## Subtasks

- [ ] Working-copy state from CombatInput
- [ ] Tick steps 1, 3, 4, 5, 6, 8 (minimal)
- [ ] Event emitter
- [ ] Test builders

## Notes

- 2026-10-01: T004 (E001) defines CombatEvent from the older research doc; where it differs from docs/architecture/event-log.md, follow event-log.md and record the change.
- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
