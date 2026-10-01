---
id: T089
epic: E023
title: Code budgets cover tsx files
summary: "The harness scan treats .tsx under codeGlobs as code, so ts_file_lines, fn_lines and comment budgets apply to UI components and .test.tsx counts as a test file."
keywords: ["codeGlobs", "tsx", "scan", "code-budgets", "ui", "harness"]
type: task
status: ready
priority: p2
model: sonnet
size: S
updated: 2026-10-01
related: ["EPIC.md"]
---

# T089: Code budgets cover tsx files

## Goal

`codeGlobs` list only `*.ts` and the scan only reads files ending in `.ts`, so every Preact
component in `src/ui` escapes the harness code budgets. Include `.tsx` so UI code is held
to the same file, function and comment limits as the rest of the codebase.

## Context

- Epic: [E023](EPIC.md)
- `harness.config.json` (`codeGlobs`), `tools/harness/core/scan.ts` (`visitFile`)
- `tools/harness/budgets/code/lines.ts` (`isTest`), `tools/harness/test/budgets.test.ts`
- Out of scope: new code budgets (T091, T092); JSX-aware parsing beyond what the line and brace heuristics need.

## Acceptance Criteria

- [ ] Test `tsx file over ts_file_lines is reported` passes: a fixture `src/ui/x.tsx` above the budget yields a `ts_file_lines` finding
- [ ] Test `test.tsx counts as a test file` passes: a long `x.test.tsx` is measured by `test_file_lines`, not `ts_file_lines`
- [ ] Test `fn_lines measures a tsx component` passes: a 60-line arrow-function component yields an `fn_lines` error
- [ ] `npm run harness:check` exits 0 on the current tree (existing .tsx files within budget)

## Subtasks

- [ ] Add `src/**/*.tsx` to codeGlobs and accept `.tsx` in the scan
- [ ] Check that the function-start regex matches typical component declarations

## Notes

- 2026-10-01: Source: forge/HANDOFF.md Pending follow-ups (codeGlobs miss .tsx).

## Log

- 2026-10-01: created
