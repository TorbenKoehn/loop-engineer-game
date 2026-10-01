---
id: T088
epic: E023
title: Fix check runner and index generator review nits
summary: "npm run check prints the spawn error when a step cannot start (R002 F3); tools/harness/gen/index.ts is split below warn_at and its JSDoc sits on generateIndexes (R005 F5, F6)."
keywords: ["check", "spawn", "error", "index", "generator", "refactor", "nits"]
type: task
status: ready
priority: p2
model: sonnet
size: S
updated: 2026-10-01
related: ["EPIC.md"]
---

# T088: Fix check runner and index generator review nits

## Goal

Clear three open review nits in harness code. When `spawnSync` cannot start a step, the
check runner today says `exit signal` and hides the cause. `tools/harness/gen/index.ts`
sits in the warn range of `ts_file_lines` (206 > 200) and `fn_lines` (renderNode 39 > 30),
and its JSDoc for `generateIndexes` drifted onto `docsByDir`.

## Context

- Epic: [E023](EPIC.md)
- [R002 F3](../../../reviews/E001/R002-T006.md), [R005 F5-F6](../../../reviews/E001/R005-T002.md)
- `tools/check/run.ts` (top-level script; importing it must not run the steps)
- `tools/harness/gen/index.ts`, `tools/harness/test/index.test.ts`
- Out of scope: changing INDEX.md output, check step order or step commands.

## Acceptance Criteria

- [ ] Test `failure line includes the spawn error` passes: for a spawn result with `error: new Error('spawn ENOENT')` the runner's FAILED line contains `spawn ENOENT`, and a plain non-zero exit still prints `exit <code>`
- [ ] `npm run harness:lint` reports no `ts_file_lines` or `fn_lines` finding (error or warn) for `tools/harness/gen/`
- [ ] `npm run harness:index` regenerates no INDEX.md (output byte-identical) and `npx vitest run tools/harness/test/index.test.ts` passes
- [ ] The JSDoc `generateIndexes` comment directly precedes `export function generateIndexes`

## Subtasks

- [ ] Extract the FAILED-line formatting into a pure, exported function and test it (e.g. `tools/check/run.test.ts`); keep the script entry behaviour
- [ ] Extract tree rendering from gen/index.ts into a sibling module

## Notes

- 2026-10-01: Sources: R002 F3, R005 F5, R005 F6.

## Log

- 2026-10-01: created
