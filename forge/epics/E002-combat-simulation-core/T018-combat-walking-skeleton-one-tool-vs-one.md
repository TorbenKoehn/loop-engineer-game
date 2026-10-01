---
id: T018
epic: E002
title: "Combat walking skeleton: one tool vs one enemy"
summary: "resolveCombat(input) with the 50 ms tick loop, charge and fire, single-target damage, a hit intent, win and loss, the core events, and sim test builders."
keywords: ["sim", "combat", "tick", "walking-skeleton", "resolve-combat", "events"]
type: task
status: done
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

- [x] Test `one grep kills one Typo` ends with outcome win, reason resolved, and toolFired events every 3000 ms at rate 100
- [x] Test `agent loses to an unbeatable enemy` ends with outcome loss, reason trust
- [x] Events follow event-log.md: seq strictly increasing from 0, t a multiple of 50, fightStart first, fightEnd last
- [x] `resolveCombat(input, { log: false })` returns the same outcome and endT with an empty events array
- [x] Builders makeTool, makeEnemy and fight() exist in `src/sim/testing` and the tests use them

## Subtasks

- [x] Working-copy state from CombatInput
- [x] Tick steps 1, 3, 4, 5, 6, 8 (minimal)
- [x] Event emitter
- [x] Test builders

## Notes

- 2026-10-01: T004 (E001) defines CombatEvent from the older research doc; where it differs from docs/architecture/event-log.md, follow event-log.md and record the change.
- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.
- 2026-10-01: CombatEvent (T004) already matches event-log.md for every kind used here; no events.ts change. Every emitted event carries `d` (required by the T004 type).
- 2026-10-01: Skeleton choices for later tasks: `toolFired.v` is the discarded progress overflow (0 at standard rates); agent `damage.d.sev` holds Trust after the hit; dmg always hits the first living enemy (T019); enemy cycle only, `hit` verb only (T021); fightStart W from model.window, B = S = model.baseWeight, N = 0, zone = 0 (T025).
- 2026-10-01: A minimal hard cap (loss, reason timeout, at deadlineMs + 30 000) is in resolve.ts so a stalled fight terminates; Deadline overtime damage stays with T023 (TODO(T023)).
- 2026-10-01: Diff is about 570 lines incl. tests and builders, above the process budget task_diff_lines (400); flagged for review.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
- 2026-10-01: AC1 verified: npx vitest run src/sim/combat (test `one grep kills one Typo`: win/resolved, toolFired at 3000..15000 ms at speed 100; 14 passed)
- 2026-10-01: AC2 verified: test `agent loses to an unbeatable enemy` (loss, reason trust, endT 3000)
- 2026-10-01: AC3 verified: `event log invariants` tests for win, loss and timeout fights (seq = 0..n-1, t % 50 = 0, non-decreasing, fightStart first, fightEnd last)
- 2026-10-01: AC4 verified: `log false keeps outcome and endT with no events` for win, loss and timeout
- 2026-10-01: AC5 verified: src/sim/testing/builders.ts exports makeTool, makeEnemy, fight; resolve.test.ts builds every input with them
- 2026-10-01: npm run check exit 0 (tsc, biome, vitest 114 passed with coverage, harness:check 0 errors)
- 2026-10-01: review requested
- 2026-10-01: R014 changes-requested (1 major: diff size). RT001 changed task_diff_lines to production lines; T018 = 358 production lines -> round 2 review
- 2026-10-01: done (R015)
