---
id: T095
epic: E023
title: "harness:diff measures production diff lines"
summary: "npm run harness:diff prints production and total changed lines of the staged diff with the budgets.md exclusions and fails over task_diff_lines or 2x total; forge-review and delegate name it."
keywords: ["harness-diff", "task_diff_lines", "numstat", "production-lines", "budgets", "review"]
type: task
status: done
priority: p0
model: opus
size: M
updated: 2026-10-01
related: ["EPIC.md", "../../../retros/RT001-first-retro-e001-foundation-and-early-e0.md"]
---

# T095: harness:diff measures production diff lines

## Goal

`task_diff_lines` and `commit_diff_lines` are process budgets measured only by prose in
`docs/harness/budgets.md`, so each reviewer measured them differently (RT001 friction 1,
proposal P1). A `harness:diff` command computes production and total changed lines of the
staged diff with the documented exclusions, so orchestrator and reviewer report the same
numbers and the 2x-total rule is checked by a program.

## Context

- [RT001 What Went Wrong 1 and proposed task P1](../../../retros/RT001-first-retro-e001-foundation-and-early-e0.md)
- `docs/harness/budgets.md` section "Measuring task diffs" (the exclusion list is the spec)
- `tools/harness/cli.ts`, `tools/harness/core/git.ts`, `tools/harness/test/git.test.ts`
- `.claude/skills/forge-review/SKILL.md` step 3, `.claude/skills/delegate/SKILL.md` step 5
- Out of scope: changing `task_diff_lines`, `commit_diff_lines` or the exclusion list; an unstaged or branch-range mode; wiring the command into `npm run check` or the lint; the `task_files_changed` budget.

## Acceptance Criteria

- [x] `npm run harness:diff` prints `production=<n> total=<m>` for `git diff --cached --numstat -M` and exits 0 when production is at most `task_diff_lines` and total at most twice that value (read from `harness.config.json`)
- [x] Vitest cases build a staged diff in a temp git repo and show each exclusion is left out of `production` but kept in `total`: `*.test.ts`, `tests/`, `**/fixtures/`, `*.jsonl`, `package-lock.json`, `*.md`; a pure rename adds 0 to production
- [x] A staged diff of 401 production lines makes `npm run harness:diff` exit 1 naming `task_diff_lines`; 400 production lines exits 0; a diff with 300 production but 801 total lines exits 1 naming the 2x total rule (both cases in vitest)
- [x] `.claude/skills/forge-review/SKILL.md` step 3 and `.claude/skills/delegate/SKILL.md` step 5 name `npm run harness:diff`, and `docs/harness/budgets.md` "Measuring task diffs" points to it
- [x] `npm run harness:check` exits 0

## Subtasks

- [x] Pure function: numstat text to `{production, total}` with the exclusion globs
- [x] CLI command `diff` and `harness:diff` script in package.json
- [x] Temp-repo tests for each exclusion and both limits
- [x] Skill and budgets.md edits

## Notes

- 2026-10-01: Source: RT001 proposal P1. Opus because it defines the measure the process budgets rest on and edits skill text.
- 2026-10-01: Touches package.json: do not run in parallel with another task that touches shared root config (T096 touches biome.jsonc).
- 2026-10-01: RT003 changed the measure: `--diff-filter=d` drops whole-file deletions from both numbers (budgets.md#measuring-task-diffs). Before start, the planner adds that case to AC2 (a deleted 500-line file adds 0).
- 2026-10-01: Scope: the orchestrator allowed `.claude/skills/delegate/SKILL.md` (and its tests.md) for AC4's delegate step 5 mention of `npm run harness:diff`.
- 2026-10-01: Measure (per orchestrator, T101 Notes): per file `added + min(added, deleted)` on `git diff --cached --numstat -z -M --diff-filter=d`, so modified lines count as before and pure deletions in kept files are free; `total` uses the same rule without exclusions. Documented in budgets.md#measuring-task-diffs. Code in `tools/harness/budgets/forge/diff.ts` (not core/, which would reach 11 files and add a dir_files warning). AC2's RT003 case is not in the AC text (planner did not add it) but is tested anyway.
- 2026-10-01: The delegation prompt also mentioned "or a given range"; Out of scope excludes a branch-range mode, so it is not implemented. The forge-task skill step 5 and its tests.md now name `npm run harness:diff` instead of the inline numstat pathspec.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
- 2026-10-01: AC1 verified: `npm run harness:diff` on this worktree's staged diff prints `production=109 total=290`, exit 0 (matches hand sum of `git diff --cached --numstat -M --diff-filter=d`); limit read via `budget(loadConfig(root), 'task_diff_lines')`
- 2026-10-01: AC2 verified: npx vitest run tools/harness/test/diff.test.ts (8 passed): temp repo stages a.test.ts, b.test.tsx, tests/, testing/, fixtures/, .jsonl, package-lock.json, .md (each production 0, total 10); pure `git mv` rename 0; deleted 500-line file 0/0; pure deletion in kept file 0
- 2026-10-01: AC3 verified: same file, spawns `node tools/harness/cli.ts diff` in the temp repo: 400 -> exit 0; 401 -> exit 1 with `task_diff_lines`; 300 production + 501 md = 801 total -> exit 1 with `2x total rule`
- 2026-10-01: AC4 partial: forge-review step 3 (and step 5) and budgets.md "Measuring task diffs" name `npm run harness:diff`; delegate step 5 not edited (outside allowed paths), box left unchecked
- 2026-10-01: AC5 verified: npm run harness:check exit 0 (0 errors, 22 warnings = baseline)
- 2026-10-01: checks: npm run check exit 0 (tsc, biome, vitest, harness:check)
- 2026-10-01: blocked: AC4 needs delegate/SKILL.md (outside allowed paths)
- 2026-10-01: orchestrator allowed delegate/SKILL.md; unblocked
- 2026-10-01: AC4 verified: delegate/SKILL.md step 5 item 6 runs `npm run harness:diff`; forge-review step 3 and budgets.md "Measuring task diffs" name it (grep -n "harness:diff" on all three)
- 2026-10-01: checks: npm run check exit 0
- 2026-10-01: review requested
- 2026-10-01: done (R065)
