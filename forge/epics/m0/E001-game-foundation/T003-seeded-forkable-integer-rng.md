---
id: T003
epic: E001
title: Seeded forkable integer RNG
summary: "Implement sfc32 seeded RNG in src/sim/rng.ts: integer-only, serializable 4x uint32 state, fork(seed, label) for independent subsystem streams, with unit and property tests."
keywords: ["rng", "seed", "fork", "integer", "determinism", "sfc32"]
type: task
status: done
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
- Tech stack: [tech-stack.md](../../../../docs/research/game/tech-stack.md) (RNG discipline)
- Design: [game-design-proposal.md](../../../../docs/research/game/game-design-proposal.md) (pillar 4: seeded, fair)

## Acceptance Criteria

- [x] Same seed yields an identical sequence across runs (fixed expected values in a test)
- [x] State serializes to JSON and restores to continue the same sequence
- [x] fork(rng, label) is deterministic and independent: drawing from one fork does not alter another
- [x] nextInt(n) returns values in [0, n) with no float use (property test)
- [x] src/sim/rng.ts has no Math.random, Date or DOM

## Subtasks

- [x] Add vitest and fast-check devDependencies if missing
- [x] Implement sfc32 core with 4x uint32 state and reference cyrb128 seed expansion (R003 F1)
- [x] Implement nextInt, int, pick, weighted and shuffle helpers (R003 F2)
- [x] Implement fork and serialize/restore of the [a, b, c, d] state
- [x] Write unit tests with reference golden sequences and fast-check property tests for bounds and fork independence

## Notes

- Attempt 2 (R003 F2, doc wins): `Rng` is the plain sfc32 tuple `[a, b, c, d]`, mutated in place and serialised as is. Exports `int(rng, lo, hi)` inclusive (replaces `range`), `pick`, `weighted(rng, {value, weight}[])` (integer weights), `shuffle` (Fisher-Yates, returns a new array). `nextInt(rng, n)` stays (named by AC4); `nextU32` stays as the raw integer draw. No float API.
- AC3 says `fork(rng, label)`; sim-core.md#rng says `fork(runSeed, path)` hashing `runSeed + '/' + path`, and a `[a, b, c, d]` state has no seed to fork from. Implemented the doc: `fork(seed, path): Rng`, plus `forkSeed(seed, path): Seed` for passing derived seeds (run-state.md `combat/<nodeId>` = combat seed) and nesting. sim-core.md does not list `forkSeed`, `nextInt`, `nextU32` or `createRng`; a doc update could add them.
- Goldens are pinned to bryc reference cyrb128 + sfc32 (12 warm-up draws) values from R003, re-verified independently with a Node script.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (sonnet)
- 2026-10-01: AC1 verified: npx vitest run src/sim/rng.test.ts golden test (golden values self-generated from this implementation)
- 2026-10-01: AC2 verified: rng.test.ts "serializes to JSON and continues the sequence"
- 2026-10-01: AC3 verified: rng.test.ts fork determinism + fast-check independence property
- 2026-10-01: AC4 verified: rng.test.ts nextInt fast-check property, n up to 2^32, integer-only (rejection sampling on uint32)
- 2026-10-01: AC5 verified: grep Math.random|Date|document|window src/sim/rng.ts finds nothing
- 2026-10-01: checks: tsc=0 vitest=0 (49 passed) harness:check=0; biome not installed (T002)
- 2026-10-01: review requested
- 2026-10-01: R003 changes-requested (0 blocker, 1 major)
- 2026-10-01: started attempt 2 (opus)
- 2026-10-01: addressed R003 (2 findings): F1 cyrb128 finalisation now sequential per reference; F2 API aligned with sim-core.md (int, pick, weighted, shuffle, fork(seed, path), state [a, b, c, d])
- 2026-10-01: AC1 verified: npx vitest run src/sim/rng.test.ts "rng golden (independent reference)": K7Q2-M9XA, fork K7Q2-M9XA/combat/p1-r3-c2, empty seed and sfc32 state [1,2,3,4] match bryc reference values (20 passed)
- 2026-10-01: AC2 verified: rng.test.ts "serializes to JSON [a, b, c, d] and continues the sequence" + invalid-state rejection
- 2026-10-01: AC3 verified: rng.test.ts fork determinism (independent of parent draws) + fast-check "drawing from one fork does not alter another"; signature fork(seed, path) per sim-core.md (see Notes)
- 2026-10-01: AC4 verified: rng.test.ts nextInt fast-check property, n in [1, 2^32], integer-only rejection sampling on uint32
- 2026-10-01: AC5 verified: rng.test.ts "rng purity" source scan for Math.random|Date|performance|crypto|timers|window|document finds nothing
- 2026-10-01: checks: npm run check exit 0: tsc=0, biome skipped (not installed, T002), vitest=0 (58 passed), harness:check=0 (1 pre-existing warn dir_subdirs)
- 2026-10-01: review requested
- 2026-10-01: done (R004)
