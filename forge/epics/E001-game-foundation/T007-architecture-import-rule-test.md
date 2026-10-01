---
id: T007
epic: E001
title: Architecture import-rule test
summary: "tests/arch.test.ts parses every import under src/ and fails on forbidden module directions or banned nondeterministic globals in src/sim and src/run."
keywords: ["architecture", "imports", "layering", "arch-test", "determinism", "boundaries"]
type: task
status: ready
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

- [ ] `npx vitest run tests/arch.test.ts` passes on the current tree
- [ ] Test `rejects forbidden import direction` feeds a synthetic `src/sim -> src/ui` import to the checker and expects a failure naming both modules
- [ ] Test `bans nondeterministic globals in sim and run` fails for synthetic sources using `Math.random`, `Date`, `performance`, timers, `window`, `document` or `crypto` under `src/sim` or `src/run`
- [ ] The allowed-direction table in the test has one row per module of overview.md (sim, content, run, save, ui, render-fx, audio, debug, tools/balance) and matches the arrows there

## Subtasks

- [ ] Scan static and dynamic import specifiers under src/ and tools/balance
- [ ] Encode the dependency table, including "sim imports only content types"
- [ ] Grep src/sim and src/run for banned globals
- [ ] Add in-memory negative fixtures for both checks

## Notes


## Log

- 2026-10-01: created
