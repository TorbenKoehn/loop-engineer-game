---
id: T096
epic: E023
title: "One determinism ban: Biome covers src/sim and src/run"
summary: "The Biome determinism ban applies to src/run as well as src/sim and the duplicate regex ban (BANNED_GLOBALS in tests/architecture/checker.ts) is deleted; model.window and { window: 1 } stay legal."
keywords: ["determinism", "biome", "gritql", "src-run", "banned-globals", "architecture-test"]
type: task
status: ready
priority: p2
model: sonnet
size: S
updated: 2026-10-01
related: ["EPIC.md", "../../../retros/RT001-first-retro-e001-foundation-and-early-e0.md", "T093-harden-the-src-sim-determinism-ban.md"]
---

# T096: One determinism ban: Biome covers src/sim and src/run

## Goal

The determinism ban exists twice: a Biome override for `src/sim` (T002, T093) and a regex
`BANNED_GLOBALS` in `tests/architecture/checker.ts` that also covers `src/run`. The weaker
regex copy misfired on `model.window` (RT001 friction 3, proposal P3). Keep one: extend
the Biome override to `src/run`, then delete the regex ban, so a rule change happens in
one place and editors flag it.

## Context

- [RT001 What Went Wrong 3 and proposed task P3](../../../retros/RT001-first-retro-e001-foundation-and-early-e0.md)
- `biome.jsonc` (src/sim override), `tools/biome/sim-determinism.grit`, `tools/biome/sim-ban.test.ts`
- `tests/architecture/checker.ts` (`BANNED_GLOBALS`, `checkGlobals`), `tests/arch.test.ts`
- Out of scope: changing the import-direction rules or `checkImports`; banning more `Math` members; writing files under `src/run` (it does not exist yet, tests use the temp sandbox).

## Acceptance Criteria

- [ ] `npx vitest run tools/biome` passes with each of `Math.random()`, `Date.now()`, `new Date()`, `performance.now()`, bare `window`, `document`, `crypto`, `setTimeout` and `setImmediate` failing lint when linted as `src/sim/x.ts` and as `src/run/x.ts` in the sandbox
- [ ] The same run shows `model.window`, `{ window: 1 }` and `Math.floor(2.5)` lint clean in `src/sim` and `src/run`, and `Math.random()` clean in `src/ui`
- [ ] `BANNED_GLOBALS`, `freeRef` and `checkGlobals` no longer exist in `tests/architecture/checker.ts`; `rg "checkGlobals|BANNED_GLOBALS" tests tools src` finds nothing
- [ ] `npx vitest run tests/arch.test.ts` passes with the global-ban cases removed and the import-rule cases unchanged
- [ ] `npm run check` exits 0

## Subtasks

- [ ] Biome override `includes` gains `src/run/**`; add `setImmediate` to deniedGlobals
- [ ] Extend sim-ban.test.ts with src/run cases and the legal `window` property and key cases
- [ ] Delete the regex ban and its tests in checker.ts and arch.test.ts; fix the comment in biome.jsonc

## Notes

- 2026-10-01: Source: RT001 proposal P3. Biome already covers every banned name except `setImmediate` (checked against biome.jsonc), hence the added entry; noRestrictedGlobals reacts to references only, so `model.window` and object keys are not flagged.
- 2026-10-01: Touches biome.jsonc: do not run in parallel with T095 (package.json) or another root-config task.

## Log

- 2026-10-01: created
