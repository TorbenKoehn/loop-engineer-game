---
id: T031
epic: E003
title: Context invariant property tests and worked example
summary: "fast-check properties 0 ≤ F ≤ W, S ≥ B, N ≥ 0 after every tick and compaction resets, plus an end-to-end test of the context.md worked example via events."
keywords: ["context", "property-tests", "invariants", "fast-check", "worked-example"]
type: task
status: backlog
priority: p2
model: sonnet
size: S
depends_on: [T029]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T031: Context invariant property tests and worked example

## Goal

Guard the context maths against regressions with properties over random inputs and the documented example.

## Context

- Epic: [E003](EPIC.md)
- [Testing: Property tests (invariant 1)](../../../../docs/architecture/testing.md#property-tests-fast-check)
- [Context: Worked example](../../../../docs/game/systems/context.md#worked-example)
- Code: `src/sim/combat/context.prop.test.ts`, `src/sim/testing/`
- Out of scope: Changing context rules; fixing found bugs beyond small fixes (report them instead).

## Acceptance Criteria

- [ ] Property test: 0 ≤ F ≤ W, S ≥ B and N ≥ 0 after every tick for 200 random inputs
- [ ] Property test: after any compaction event N = 0 and F < W
- [ ] Test `context worked example` reproduces each step of context.md "Worked example" through events

## Subtasks

- [ ] Ctx snapshots per tick in test mode
- [ ] Properties
- [ ] Worked example test

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
