---
id: T092
epic: E023
title: Harness counts suppression markers and duplication
summary: "Harness lint counts @ts-expect-error, lint-disable comments and @ts-nocheck repo-wide and measures duplicated-line percentage, closing the last budgets that nothing enforces."
keywords: ["ts_expect_error", "eslint_disable", "ts-nocheck", "duplication_pct", "harness", "enforced_by"]
type: task
status: backlog
priority: p2
model: opus
size: M
depends_on: [T091]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T092: Harness counts suppression markers and duplication

## Goal

The repo-wide budgets `ts_expect_error`, `eslint_disable` and `duplication_pct` are
labelled `enforced_by: biome` but nothing measures them, and `ts_ignore` misses
`@ts-nocheck` because Biome's noTsIgnore only sees `@ts-ignore` (R005 F1, F3). Add harness
checks for all of them so suppressions and copy-paste stay visible.

## Context

- Epic: [E023](EPIC.md)
- [R005 F1, F3](../../reviews/R005-T002.md), [Code budgets research](../../../docs/research/budgets/budgets-code.md)
- `tools/harness/budgets/code/code.ts` and `comments.ts` (comment parsing), `harness.config.json`
- Tests go in a new `tools/harness/test/code-markers.test.ts` (budgets.test.ts belongs to T089)
- Out of scope: biome.jsonc (T093); per-module budgets (T091); budget values; cross-language duplication (code files only).

## Acceptance Criteria

- [ ] Test `counts ts-expect-error repo-wide` passes: 6 `@ts-expect-error` comments across files yield a `ts_expect_error` warn, 5 yield none
- [ ] Test `counts lint-disable comments` passes: 6 comments mixing `biome-ignore` and `eslint-disable` yield an `eslint_disable` warn
- [ ] Test `ts-nocheck is a ts_ignore error` passes: one `// @ts-nocheck` comment yields a `ts_ignore` error; the same text inside a string literal yields none
- [ ] Test `duplication_pct measures repeated line windows` passes: two files sharing a repeated block above 3 % of code lines yield a warn naming both files; blank and import lines do not count
- [ ] `npm run harness:check` exits 0 on the current tree and docs/harness/budgets-table.md lists `harness` as enforcer for ts_expect_error, eslint_disable and duplication_pct

## Subtasks

- [ ] Markers count only inside comments (reuse comment detection)
- [ ] Duplication: normalised lines (trimmed), fixed window (e.g. 6 lines), hashed; document the window in the budget description
- [ ] Decide whether ts_ignore keeps `biome` (and harness adds nocheck) or moves to `harness`; record in Notes

## Notes

- 2026-10-01: Sources: R005 F1, F3; T002 Notes.
- 2026-10-01: Held in backlog: depends on T091 (same check registry and config lines) and `wip_ready`. DoR otherwise met.

## Log

- 2026-10-01: created
