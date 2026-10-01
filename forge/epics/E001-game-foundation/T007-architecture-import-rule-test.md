---
id: T007
epic: E001
title: Architecture import-rule test
summary: "tests/arch.test.ts parses every import under src/ and fails on forbidden module directions or banned nondeterministic globals in src/sim and src/run."
keywords: ["architecture", "imports", "layering", "arch-test", "determinism", "boundaries"]
type: task
status: done
priority: p0
model: sonnet
size: S
depends_on: [T001]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T007: Architecture import-rule test

## Goal

Enforce the module dependency rules of the architecture overview with a test, so later epics cannot couple sim, run and UI by accident. The reviewer relies on this gate for layering; Biome rules (T002) only give editor feedback.

## Context

- Epic: [E001](EPIC.md)
- [Architecture overview: Dependency rules and hard rules 1-5](../../../docs/architecture/overview.md#dependency-rules)
- [Testing strategy: Levels (Architecture row)](../../../docs/architecture/testing.md#levels)
- Code: `tests/arch.test.ts`, `src/` (stubs from T001)
- Out of scope: Biome noRestrictedImports overrides (T002), coverage gates (separate task), module code beyond the T001 stubs.

## Acceptance Criteria

- [x] `npx vitest run tests/arch.test.ts` passes on the current tree
- [x] Test `rejects forbidden import direction` feeds a synthetic `src/sim -> src/ui` import to the checker and expects a failure naming both modules
- [x] Test `bans nondeterministic globals in sim and run` fails for synthetic sources using `Math.random`, `Date`, `performance`, timers, `window`, `document` or `crypto` under `src/sim` or `src/run`
- [x] The allowed-direction table in the test has one row per module of overview.md (sim, content, run, save, ui, render-fx, audio, debug, tools/balance) and matches the arrows there

## Subtasks

- [x] Scan static and dynamic import specifiers under src/ and tools/balance
- [x] Encode the dependency table, including "sim imports only content types"
- [x] Grep src/sim and src/run for banned globals
- [x] Add in-memory negative fixtures for both checks

## Notes

- Orchestrator 2026-10-01: R008 F1 - src/sim/golden/golden.ts uses node:fs/node:crypto (test-only). Move these Node helpers to tools/golden/ as part of this task so the sim import rule holds without exceptions.


## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (sonnet)
- 2026-10-01: moved Node helpers golden.ts, golden.test.ts, fixtures/ from src/sim/golden to tools/golden (stub-fight.ts stays); update.ts paths adjusted
- 2026-10-01: AC1 verified: npx vitest run tests/arch.test.ts passes on tree (golden helpers moved so sim has no node:* imports)
- 2026-10-01: AC2 verified: test 'rejects forbidden import direction' (src/sim -> src/ui, message names sim and ui)
- 2026-10-01: AC3 verified: it.each 'bans nondeterministic globals in sim and run' covers all 7 globals for src/sim and src/run
- 2026-10-01: AC4 verified: ALLOWED table in tests/architecture/checker.ts has 9 rows; test checks the keys
- 2026-10-01: npm run check exit 0 (tsc, biome, vitest+coverage, harness)
- 2026-10-01: review requested
- 2026-10-01: done (R012)
