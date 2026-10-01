---
id: T017
epic: E002
title: Integer math helpers for the sim
summary: "src/sim/int.ts with pct, mulDiv, clamp and ceilDiv exactly as in sim-core.md, safe-integer assertions in dev builds, and exhaustive unit tests."
keywords: ["sim", "integer-math", "helpers", "determinism", "rounding"]
type: task
status: ready
priority: p0
model: sonnet
size: S
depends_on: [T001]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T017: Integer math helpers for the sim

## Goal

All sim arithmetic goes through one tested module so rounding is identical everywhere and unsafe integers are caught early.

## Context

- Epic: [E002](EPIC.md)
- [Simulation core: Integer maths](../../../docs/architecture/sim-core.md#integer-maths)
- [ADR-002 deterministic sim](../../../docs/architecture/adr/adr-002-deterministic-sim.md)
- Code: `src/sim/int.ts`, `src/sim/int.test.ts`
- Out of scope: RNG (T003), combat logic, fast-forward.

## Acceptance Criteria

- [ ] Test `pct rounds half up` covers positive, negative and zero p against `Math.floor((x * (100 + p) + 50) / 100)`
- [ ] Test `mulDiv asserts safe integers` expects a throw in dev mode for an unsafe product
- [ ] Tests for clamp and ceilDiv, including exact multiples, pass
- [ ] `src/sim/int.ts` has 100% line and branch coverage

## Subtasks

- [ ] Implement helpers
- [ ] Dev-only safe-integer assertion
- [ ] Unit tests

## Notes


## Log

- 2026-10-01: created
