---
id: T003
epic: E001
title: Seeded forkable integer RNG
summary: "Implement sfc32 seeded RNG in src/sim/rng.ts: integer-only, serializable 4x uint32 state, fork(seed, label) for independent subsystem streams, with unit and property tests."
keywords: ["rng", "seed", "fork", "integer", "determinism", "sfc32"]
type: task
status: ready
priority: p0
model: sonnet
size: S
depends_on: [T001]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T003: Seeded forkable integer RNG

## Goal

Implement the seeded PRNG that all sim randomness flows through. It must be integer-only, serializable and forkable so changing one subsystem never shifts another stream.

## Context

- Epic: [E001](EPIC.md)
- Tech stack: [tech-stack.md](../../../docs/research/game/tech-stack.md) (RNG discipline)
- Design: [game-design-proposal.md](../../../docs/research/game/game-design-proposal.md) (pillar 4: seeded, fair)

## Acceptance Criteria

- [ ] Same seed yields an identical sequence across runs (fixed expected values in a test)
- [ ] State serializes to JSON and restores to continue the same sequence
- [ ] fork(rng, label) is deterministic and independent: drawing from one fork does not alter another
- [ ] nextInt(n) returns values in [0, n) with no float use (property test)
- [ ] src/sim/rng.ts has no Math.random, Date or DOM

## Subtasks

- [ ] Add vitest and fast-check devDependencies if missing
- [ ] Implement sfc32 core with 4x uint32 state and seed expansion
- [ ] Implement nextInt, range and pick helpers
- [ ] Implement fork and serialize/restore
- [ ] Write unit tests with golden sequences and write fast-check property tests for bounds and fork independence

## Notes

## Log

- 2026-10-01: created
