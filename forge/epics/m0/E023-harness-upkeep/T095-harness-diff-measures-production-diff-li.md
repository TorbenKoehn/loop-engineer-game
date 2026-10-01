---
id: T095
epic: E023
title: "harness:diff measures production diff lines"
summary: "npm run harness:diff prints production and total changed lines of the staged diff with the budgets.md exclusions and fails over task_diff_lines or 2x total; forge-review and delegate name it."
keywords: ["harness-diff", "task_diff_lines", "numstat", "production-lines", "budgets", "review"]
type: task
status: ready
priority: p1
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

- [ ] `npm run harness:diff` prints `production=<n> total=<m>` for `git diff --cached --numstat -M` and exits 0 when production is at most `task_diff_lines` and total at most twice that value (read from `harness.config.json`)
- [ ] Vitest cases build a staged diff in a temp git repo and show each exclusion is left out of `production` but kept in `total`: `*.test.ts`, `tests/`, `**/fixtures/`, `*.jsonl`, `package-lock.json`, `*.md`; a pure rename adds 0 to production
- [ ] A staged diff of 401 production lines makes `npm run harness:diff` exit 1 naming `task_diff_lines`; 400 production lines exits 0; a diff with 300 production but 801 total lines exits 1 naming the 2x total rule (both cases in vitest)
- [ ] `.claude/skills/forge-review/SKILL.md` step 3 and `.claude/skills/delegate/SKILL.md` step 5 name `npm run harness:diff`, and `docs/harness/budgets.md` "Measuring task diffs" points to it
- [ ] `npm run harness:check` exits 0

## Subtasks

- [ ] Pure function: numstat text to `{production, total}` with the exclusion globs
- [ ] CLI command `diff` and `harness:diff` script in package.json
- [ ] Temp-repo tests for each exclusion and both limits
- [ ] Skill and budgets.md edits

## Notes

- 2026-10-01: Source: RT001 proposal P1. Opus because it defines the measure the process budgets rest on and edits skill text.
- 2026-10-01: Touches package.json: do not run in parallel with another task that touches shared root config (T096 touches biome.jsonc).

## Log

- 2026-10-01: created
