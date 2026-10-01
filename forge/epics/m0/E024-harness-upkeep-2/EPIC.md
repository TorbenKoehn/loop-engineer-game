---
id: E024
title: Harness upkeep 2
summary: "Retro follow-ups from RT003-RT005: e2e in the check gate, forge bookkeeping lint, a commit gate, a fairer harness:diff with companion docs, and code folders below dir_files warn_at."
keywords: ["epic", "harness", "upkeep", "dir-files", "e2e", "harness-diff", "retro"]
type: epic
status: ready
priority: p1
milestone: m0
updated: 2026-10-01
related: ["../../../retros/RT003-third-retro-e003-e004-e006-run-and-ui-ba.md", "../../../retros/RT004-fourth-retro-e007-e008-e009-sim-save-and.md", "../E023-harness-upkeep/EPIC.md"]
---

# E024: Harness upkeep 2

## Goal

Continues E023 (full at `tasks_per_epic`) with retro follow-ups. After this epic
`npm run check` runs build and e2e, lint catches status, AC and Log mismatches before the
commit, `harness:diff` reports CSS separately, skips generated files and names companion
docs, and feature tasks no longer hit `dir_files` warnings in crowded `src/` folders.
Sources: RT003 P1, P2; RT004 P1-P4; RT005 P1-P3.

## Scope

- T102 check runs build and e2e (RT004 P1), T103 forge lint (RT004 P2), T107 commit gate (RT004 P3).
- T104 CSS and generated files in `harness:diff` (RT004 P4), T106 companion docs (RT003 P2).
- T105 regroup eight crowded `src/` folders (RT003 P1, widened); T108 split `apply`/`legalActions`.
- T118 `e2e_pinned_number` lint warning (RT005 P1); T119 check stable under parallel load (RT005 P2).
- The `tools/harness/gen/index.ts` length warnings are covered by T088 (E023), not here.

## Out of Scope

- Changing budget values in `harness.config.json` (new entries such as `task_css_lines` and `e2e_pinned_number` are in scope).
- Feature work in `src/`, other than the folder moves and the T108 refactor.

## Definition of Done

- [ ] `npm run harness:lint` shows no `dir_files` warning for the eight folders named in T105
- [ ] `npm run harness:diff` prints `css=` and `companion:` lines (vitest cases)
- [ ] `npm run check` runs build and e2e and exits 0
- [ ] `git commit` through the Bash tool is blocked while harness lint has errors

## Order

T102 and T103 first (p0), then T104, then T105 alone, then T108. T106 after T104. T107 is p0 and runs next (RT005 P3). T118 any time; T119 after T105, not alongside T108.
