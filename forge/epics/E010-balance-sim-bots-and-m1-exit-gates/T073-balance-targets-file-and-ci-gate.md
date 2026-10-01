---
id: T073
epic: E010
title: Balance targets file and CI gate
summary: "tools/balance/targets.json with the M1 targets copied from the GDD and a balance:check script that fails naming the violated metric."
keywords: ["balance", "targets", "ci", "gate", "exit-criteria"]
type: task
status: backlog
priority: p1
model: sonnet
size: S
depends_on: [T072]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T073: Balance targets file and CI gate

## Goal

Balance regressions fail the build instead of being noticed by players.

## Context

- Epic: [E010](EPIC.md)
- [Testing: CI order, Balance sim (targets)](../../../docs/architecture/testing.md#ci-order-fail-fast)
- [Vertical slice: Exit criteria](../../../docs/game/vertical-slice.md#exit-criteria)
- [Phase 1: Balance expectations](../../../docs/game/content/phase-1-implement.md#balance-expectations-phase-1)
- Code: `tools/balance/targets.json`, `tools/balance/check.ts`, `package.json`
- Out of scope: CI workflow files, tuning (separate task).

## Acceptance Criteria

- [ ] targets.json holds M1 exit criteria 1, 2 and 5 and the phase-1 balance expectations, each citing its source doc
- [ ] `npm run balance:check` exits non-zero and names the metric for a doctored report (test)
- [ ] `npm run balance:check` exits 0 for a report within all targets (test)

## Subtasks

- [ ] Targets file
- [ ] Checker
- [ ] Script

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
