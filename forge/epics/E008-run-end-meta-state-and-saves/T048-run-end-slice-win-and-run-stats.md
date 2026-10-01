---
id: T048
epic: E008
title: Run end, slice win and run stats
summary: "Run-end path: a Legacy Monolith win ends the M1 run as shipped, Trust 0 as ctrlc, abandon as a loss; RunStats collects what the summary and history need."
keywords: ["run-end", "stats", "slice", "reducer", "summary"]
type: task
status: backlog
priority: p1
model: opus
size: M
depends_on: [T042]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T048: Run end, slice win and run stats

## Goal

Every run ends cleanly with the data needed to explain why, which the summary, lessons and history depend on.

## Context

- Epic: [E008](EPIC.md)
- [Run state: Modes, Invariants](../../../docs/architecture/run-state.md#modes)
- [Vertical slice: deviations (run length)](../../../docs/game/vertical-slice.md#slice-specific-deviations)
- [Onboarding: Why did I lose?](../../../docs/game/ux/onboarding.md#why-did-i-lose-run-end-summary)
- Code: `src/run/apply.ts`, `src/run/stats.ts`
- Out of scope: Phase transitions and the 3-phase run end (E012), Training Data (E015), the run-end screen (E009).

## Acceptance Criteria

- [ ] Winning p1b ends the run with result shipped and mode runEnd; Trust 0 in any fight ends it with ctrlc (tests)
- [ ] abandon from the map ends the run as a loss with no lesson choice
- [ ] RunStats records cause of the final damage, damage by source, time per zone, compactions and nodes cleared
- [ ] Property test: random legal action sequences never throw and reach runEnd within 2000 actions

## Subtasks

- [ ] End transitions
- [ ] Stats aggregation from CombatStats
- [ ] Property test

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
