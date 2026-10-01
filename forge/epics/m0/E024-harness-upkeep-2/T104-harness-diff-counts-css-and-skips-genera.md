---
id: T104
epic: E024
title: "harness:diff counts CSS and skips generated files"
summary: "harness:diff prints production, css and total; stylesheets leave production under a new task_css_lines cap of 300; golden fixtures, *.gen.ts and generated indexes leave both numbers."
keywords: ["harness-diff", "css", "task_css_lines", "generated", "goldens", "diff-budget"]
type: task
status: ready
priority: p1
model: opus
size: M
updated: 2026-10-01
related: ["EPIC.md", "../../../retros/RT004-fourth-retro-e007-e008-e009-sim-save-and.md"]
---

# T104: harness:diff counts CSS and skips generated files

## Goal

`harness:diff` counts declarative CSS and generated files like hand-written logic: T063
(614, CSS 275) and T064 (712, CSS 276) needed overrides, and T024's total was 1252 lines,
588 of them generated golden JSONL (RT004 What Went Wrong 3). budgets.md already gives
CSS its own 300-line cap, but implementers subtract it by hand. After this task the tool
reports CSS separately, enforces its cap, and leaves generated output out of both numbers.

## Context

- Epic: [E024](EPIC.md); [RT004 proposal P4](../../../retros/RT004-fourth-retro-e007-e008-e009-sim-save-and.md)
- `tools/harness/budgets/forge/diff.ts`, `tools/harness/cli.ts` (`diff` command), `tools/harness/test/diff.test.ts`
- `harness.config.json` (`task_diff_lines` entry as the model), `docs/harness/budgets.md` "Measuring task diffs"
- Out of scope: changing `task_diff_lines`, the 2x total rule or the per-file measure; a branch-range mode; companion docs (T106); wiring harness:diff into `npm run check`.

## Acceptance Criteria

- [ ] `npm run harness:diff` prints `production=<n> css=<c> total=<m>`; vitest in a temp repo shows staged `*.css` lines counted in `css` and `total` but not in `production`
- [ ] `harness.config.json` has budget `task_css_lines` (300, process) and docs/harness/budgets-table.md lists it; vitest shows 301 staged CSS lines exit 1 naming `task_css_lines` and 300 exit 0
- [ ] Vitest shows staged `tools/golden/fixtures/**`, `**/*.gen.ts`, `**/INDEX.md`, `forge/BOARD.md` and `docs/harness/budgets-table.md` add 0 to `production` and `total`
- [ ] budgets.md "Measuring task diffs" documents the `css` number and the generated-file rule, and the "Until harness:diff measures it" sentence is gone
- [ ] `npm run harness:check` exits 0

## Subtasks

- [ ] Extend `DiffSize` with `css`; a generated-file glob list next to `DIFF_EXCLUDE`
- [ ] Budget entry plus `npm run harness:budgets`
- [ ] CLI output and breach messages
- [ ] Temp-repo vitest cases
- [ ] budgets.md edit (and forge-review step 3 / delegate step 6 if they quote the output format)

## Notes

- 2026-10-01: Source: RT004 P4. Opus: it changes the measure that process budgets rest on.
- 2026-10-01: T091 (E023, ready) also edits `harness.config.json`; do not run the two in parallel. T106 builds on this task's `diff` command.

## Log

- 2026-10-01: created
