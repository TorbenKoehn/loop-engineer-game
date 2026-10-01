---
id: T048
epic: E008
title: Run end, slice win and run stats
summary: "Run-end path: a Legacy Monolith win ends the M1 run as shipped, Trust 0 as ctrlc, abandon as a loss; RunStats collects what the summary and history need."
keywords: ["run-end", "stats", "slice", "reducer", "summary"]
type: task
status: done
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
- [Run state: Modes, Invariants](../../../../docs/architecture/run-state.md#modes)
- [Vertical slice: deviations (run length)](../../../../docs/game/vertical-slice.md#slice-specific-deviations)
- [Onboarding: Why did I lose?](../../../../docs/game/ux/onboarding.md#why-did-i-lose-run-end-summary)
- Code: `src/run/apply.ts`, `src/run/stats.ts`
- Out of scope: Phase transitions and the 3-phase run end (E012), Training Data (E015), the run-end screen (E009).

## Acceptance Criteria

- [x] Winning p1b ends the run with result shipped and mode runEnd; Trust 0 in any fight ends it with ctrlc (tests)
- [x] abandon from the map ends the run as a loss with no lesson choice
- [x] RunStats records cause of the final damage, damage by source, time per zone, compactions and nodes cleared
- [x] Property test: random legal action sequences never throw and reach runEnd within 2000 actions

## Subtasks

- [x] End transitions
- [x] Stats aggregation from CombatStats
- [x] Property test

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.
- 2026-10-01: CombatStats lacks zone time, cause and per-source damage, so `fight()` now resolves with the log (not stored) and `src/run/stats.ts` folds it (onboarding.md: "computed from the run's event logs"). A won Release ends the run directly (no boss reward, like the phase-3 boss in run-state.md#modes); the two Release reward tests in rewards.test.ts now call `enterReward` directly, assertions unchanged.
- 2026-10-01: Follow-up outside allowed paths: docs/architecture/run-state.md still says `{log: false}`, "Release win: continue enters reward" and the old RunStats line; it should list src/run/stats.ts and combat.ts in related_code.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
- 2026-10-01: AC1 verified: npx vitest run src/run/combat.test.ts ("winning the Phase-1 boss (p1-boss) ships the run in M1", "a real p1-boss win ships the run (fixed seeds, no abandon)", "Trust 0 clamps Trust and continue ends the run as ctrlc"; 16 passed)
- 2026-10-01: AC2 verified: combat.test.ts "abandon from the map ends the run as a loss without a lesson choice" (result abandoned, pending null, legalActions [], abandon outside map wrongMode)
- 2026-10-01: AC3 verified: combat.test.ts "run stats" (3 tests: cause, damageBySource, lastFight.zoneMs, compactions, nodesCleared; real fight damage sum = CombatStats.damageTaken, zone ms sum = endT)
- 2026-10-01: AC4 verified: apply.test.ts "random legal sequences never throw and reach runEnd within 2000 actions" (fast-check, 50 runs, with and without abandon)
- 2026-10-01: npm run check: all steps passed (tsc, biome, vitest, harness:check 0 errors); production diff 163 lines
- 2026-10-01: review requested
- 2026-10-01: done (R050)
