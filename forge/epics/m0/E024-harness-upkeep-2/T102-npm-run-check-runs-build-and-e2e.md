---
id: T102
epic: E024
title: npm run check runs build and e2e
summary: "npm run check runs vite build and the Playwright suite after vitest when the working tree changes src/ or tests/e2e/, else prints a skip reason; a failing spec fails check."
keywords: ["check", "e2e", "playwright", "build", "gate", "verification"]
type: task
status: in-progress
priority: p0
model: sonnet
size: S
updated: 2026-10-01
related: ["EPIC.md", "../../../retros/RT004-fourth-retro-e007-e008-e009-sim-save-and.md"]
---

# T102: npm run check runs build and e2e

## Goal

`npm run check` stops at vitest and harness:check, so a fight-outcome change broke
`tests/e2e/combat.spec.ts` unnoticed until a later task (RT004 What Went Wrong 1, T029
and T064). The build and the Playwright suite run only when the orchestrator remembers
the extra lines in delegate step 5. After this task the single gate runs both whenever
the change can affect them, so a red spec fails check for every implementer and reviewer.

## Context

- Epic: [E024](EPIC.md); [RT004 proposal P1](../../../retros/RT004-fourth-retro-e007-e008-e009-sim-save-and.md)
- `tools/check/run.ts` (steps and `skipIf`), `playwright.config.ts`
- `CLAUDE.md` (check line), `.claude/skills/delegate/SKILL.md` step 5, `.claude/skills/forge-task/SKILL.md` step 7
- Out of scope: new e2e specs; changing Playwright config, browsers or timeouts; the `check_all_s` budget value; running e2e inside `harness:check` or hooks; the error-message work of T088.

## Acceptance Criteria

- [ ] With a changed or untracked file under `src/` or `tests/e2e/` (against `HEAD`), `npm run check` runs `npm run build` and then `npm run e2e` after the vitest step (Log shows the step lines)
- [ ] Vitest test `skips build and e2e without src or e2e changes` passes: for a changed-file list with no `src/` or `tests/e2e/` path the skip function returns a reason, and check prints `SKIPPED - <reason>` for both steps
- [ ] With one assertion in a `tests/e2e/*.spec.ts` temporarily broken, `npm run check` exits non-zero at the e2e step (Log records command and exit code; the spec is restored)
- [ ] `CLAUDE.md` names build and e2e in the `npm run check` line, and neither delegate step 5 nor forge-task step 7 lists a separate `npm run build` / `npm run e2e` command
- [ ] `npm run check` exits 0 on the finished tree

## Subtasks

- [ ] Pure function: changed paths to skip reason (testable without spawning)
- [ ] Changed paths from `git status --porcelain` (staged, unstaged, untracked)
- [ ] Two new steps after vitest, before harness:check
- [ ] Update CLAUDE.md, delegate step 5, forge-task step 7 (and their tests.md if they quote the lines)

## Notes

- 2026-10-01: Source: RT004 P1 (p0). Run first in E024.
- 2026-10-01: T088 (E023, ready) also edits `tools/check/run.ts`; do not run the two in parallel.
- 2026-10-01: Importing `run.ts` runs the steps (T088 fixes this). Put the skip logic in its own module so the vitest case does not import `run.ts`.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (sonnet)
