---
id: T091
epic: E023
title: Harness enforces per-module code budgets
summary: "Harness lint measures imports_per_module, exports_per_module and nesting_depth per code file, and the budgets table names harness as their enforcer."
keywords: ["imports_per_module", "exports_per_module", "nesting_depth", "harness", "code-budgets", "enforced_by"]
type: task
status: ready
priority: p2
model: sonnet
size: S
updated: 2026-10-01
related: ["EPIC.md"]
---

# T091: Harness enforces per-module code budgets

## Goal

Three budgets are labelled `enforced_by: biome`, but Biome 2.5 has no rule for them, so
nothing checks them (R005 F3, T002 Notes). Add harness checks that count imports and
exports per module and the deepest block nesting per function, and relabel the budgets
so the table tells the truth.

## Context

- Epic: [E023](EPIC.md)
- [R005 F3](../../../reviews/E001/R005-T002.md), [T002 Notes](../E001-game-foundation/T002-configure-biome-with-code-budgets.md)
- `tools/harness/budgets/code/code.ts` (brace heuristics, check registry), `tools/harness/budgets/util.ts`
- `harness.config.json` (budgets); tests go in a new `tools/harness/test/code-structure.test.ts`
- Out of scope: duplication_pct and comment-marker counts (T092); biome.jsonc edits (T093); budget values.

## Acceptance Criteria

- [ ] Test `imports_per_module counts import statements` passes: 16 imports (multi-line imports count once) yield a warn, 15 yield none
- [ ] Test `exports_per_module counts exported names` passes: 11 exported names (including `export { a, b }` and `export type`) yield a warn
- [ ] Test `nesting_depth reports deep blocks` passes: a function with 4 nested blocks yields an error naming the function and line; braces in strings and comments are ignored
- [ ] `npm run harness:budgets` lists `harness` as enforcer for the three budgets in docs/harness/budgets-table.md
- [ ] `npm run harness:check` exits 0 on the current tree, or each new finding has a justified override

## Subtasks

- [ ] Reuse the string-stripping and brace helpers from code.ts
- [ ] New check module under tools/harness/budgets/code/, registered in codeChecks
- [ ] Relabel enforced_by in harness.config.json and regenerate the table

## Notes

- 2026-10-01: Sources: R005 F3, T002 Notes (budgets enforced by nothing).

## Log

- 2026-10-01: created
