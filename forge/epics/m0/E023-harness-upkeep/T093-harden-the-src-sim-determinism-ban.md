---
id: T093
epic: E023
title: Harden the src/sim determinism ban
summary: "Biome rejects aliased Math, globalThis, crypto and computed Math.random access in src/sim; the ban test lints isolated temp files; biome.jsonc stops claiming noTsIgnore covers @ts-nocheck."
keywords: ["sim-ban", "determinism", "biome", "gritql", "globalThis", "crypto", "ts-nocheck"]
type: task
status: done
priority: p2
model: sonnet
size: S
updated: 2026-10-01
related: ["EPIC.md"]
---

# T093: Harden the src/sim determinism ban

## Goal

The src/sim ban only matches literal calls: `const r = Math; r.random()`,
`globalThis.Math.random()` and `crypto.getRandomValues()` lint clean (R005 F2). Its test
writes fixtures into the live `src/sim` with colliding names, so an aborted run breaks
lint (R005 F4). Close these gaps at the Biome level so editors flag them, and fix the
wrong `@ts-nocheck` claim in biome.jsonc (R005 F1).

## Context

- Epic: [E023](EPIC.md)
- [R005 F1, F2, F4](../../../reviews/E001/R005-T002.md), [ADR-002 deterministic sim](../../../../docs/architecture/adr/adr-002-deterministic-sim.md)
- `biome.jsonc` (src/sim override), `tools/biome/sim-determinism.grit`
- `tools/biome/sim-ban.test.ts`
- Out of scope: the architecture import test (T007); harness `@ts-nocheck` counting (T092); banning `Math` members other than `random` (int helpers use `Math.imul`, `Math.floor`).

## Acceptance Criteria

- [x] `npx vitest run tools/biome` passes with new cases failing lint in src/sim: `const r = Math; r.random()`, `globalThis.Math.random()`, `Math['random']()`, `crypto.getRandomValues(a)`, `self.setTimeout`
- [x] The same run proves `Math.floor(2.5)` and `Math.imul(3, 4)` still lint clean in src/sim
- [x] sim-ban.test.ts writes each fixture under a unique path (no name collisions) and removes it in a `finally` or `afterEach`; after a run, `git status --porcelain src` lists no fixture file
- [x] biome.jsonc no longer says noTsIgnore covers `@ts-nocheck`, and lists `@ts-nocheck` with the budgets Biome does not enforce

## Subtasks

- [x] Add `globalThis`, `self`, `crypto`, `performance` to deniedGlobals for src/sim
- [x] Grit: flag `Math` used other than as `Math.<member>` and computed `Math[...]` access
- [x] Unique fixture names (counter or random suffix) under a dedicated `src/sim/__ban__/` or a temp copy of the config

## Notes

- 2026-10-01: Sources: R005 F1, F2, F4.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (sonnet)
- 2026-10-01: AC1 verified: npx vitest run tools/biome (14 passed; aliased/destructured Math, globalThis.Math.random, Math['random'], crypto, self.setTimeout fail lint)
- 2026-10-01: AC2 verified: same run, Math.floor(2.5) and Math.imul(3, 4) exit 0 in src/sim
- 2026-10-01: AC3 verified: fixtures live only in an os.tmpdir() sandbox with unique names, removed in finally, sandbox removed in afterAll; test never writes under src/ (no git repo here, so porcelain not runnable)
- 2026-10-01: AC4 verified: biome.jsonc comment corrected, @ts-nocheck listed among unenforced budgets
- 2026-10-01: npm run check: steps 1-3 pass; step 4 fails only on wip_in_progress (4 in-progress tasks, concurrent work), unrelated
- 2026-10-01: review requested
- 2026-10-01: done (R010)
