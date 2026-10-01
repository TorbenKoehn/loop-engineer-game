---
id: RT001
title: "First retro: E001 foundation and early E002/E005/E023"
summary: "12 tasks done, 11 approved first round. task_diff_lines now counts production lines only; parallel worktrees keep shared config serial; orchestrator gets a narrow hotfix exception."
keywords: ["retro", "diff-budget", "worktrees", "hotfix", "sizing", "e001"]
type: retro
status: active
updated: 2026-10-01
---

# RT001: First retro: E001 foundation and early E002/E005/E023

Scope: whole history (no earlier retro). Done: T001-T004, T006-T010, T017, T093, T094.
T018 is in review (R014 changes-requested), so it is counted for reviews only.

## Contents

What Went Well · What Went Wrong · Learnings · Actions · Deletions · Budget overrides

## What Went Well

- **Numbers**: 12 tasks done. 11/12 approved in round 1 (92%; 11/13 with T018).
  1.08 attempts on average (13/12). 1 escalation to Opus (T003 attempt 2 after R003).
  0 re-plans, 0 blocked. Lint: 0 errors, 6 warnings (budget 25). 0 active overrides.
- Only 2 blocking findings in 14 reviews. R003 F1 (cyrb128 finalisation) was a real
  defect that tests could not catch, because the goldens came from the same code.
  Round 2 pinned it to independent reference values. Keep asking for independent oracles.
- Every AC has a command or test as evidence in the Log, and reviewers re-ran them.
- Harness upkeep tasks (T093, T094) were small (28 and 91 production lines). Each was
  approved in round 1 and fixed a measured problem: lint went from 14 s to 2.4 s.

## What Went Wrong

1. **The diff budget was measured on the wrong quantity, and each reviewer measured it
   differently.** Evidence: the same kind of breach got no finding in R009 (T009, 877
   raw), a minor in R013 (T010, 865 raw) and a major in R014 (T018, 583 raw). T003 (511)
   and T007 (726, mostly CRLF churn and a file move) were never flagged. T002 changed
   1143 production lines (Biome adoption plus lint fixes in 35 `tools/harness` files) and
   hit the 60-turn implementer limit. → Root cause: the measure was defined only in the
   research doc, no command computes it, and the planner had no sizing heuristic. Opus M
   tasks came out at 1.2-1.3× the budget even in production lines (T009 512, T010 483). Counting tests penalised
   thorough tests: T018 has 358 production lines plus 194 lines of tests and builders.
2. **Parallel worktrees caused friction.** Evidence: worktrees under `.claude/worktrees`
   were scanned by lint, Biome and Vitest (hotfix 8467563). A stale generated
   `.claude/worktrees/INDEX.md` (13:31) is still on disk. `package.json` patches
   conflicted, and every worktree ran `npm ci`. → Root cause: `parallel.md` checked only
   for disjoint Context paths. Shared root config is an implicit dependency between tasks.
3. **The orchestrator wrote code twice without a review.** Evidence: 8467563 (9 lines of
   config, sound) and becc961 (regex in `tests/architecture/checker.ts`, no regression
   test). The regex flagged `model.window` in T018. → Root cause: orchestrator rule 1 has
   no exception path, so the fix was ad hoc. The determinism ban also exists twice: as a
   regex (T007) and as a Biome GritQL plugin (T002, T093). The weaker regex copy
   misfired.

Other observations from the orchestrator:
- Review titles over 60 characters: T086 (ready) already covers it. No action.
- CRLF from Python edits: fixed by 551295e (`.gitattributes`). `git ls-files --eol` now
  shows 0 CRLF files. No action.
- T002 hit the 60-turn limit: an oversized task (friction 1), not a turn budget problem.
- Custom agents cannot be spawned until the session restarts: platform behaviour. The
  workaround is now documented (action 3).
- `forge/reviews` holds 14 files (`dir_files` warns at 10). It reaches the error
  threshold after about two more reviews, which will block `harness:check`. See
  proposed task P2.

## Learnings

- A process budget that blocks needs a command that measures it. Otherwise each
  reviewer interprets it differently.
- Budgets borrowed from human research must measure the same thing as that research.
  The SmartBear figure is about code under review. Agent reviewers check tests by
  running them.
- Sizing needs concrete split patterns, not only budget names. All four oversized tasks
  followed one of four patterns.
- When the same rule is enforced by two mechanisms, they drift apart. Keep one.

## Actions

- [x] Redefine `task_diff_lines` and `commit_diff_lines` as production lines (tests,
  fixtures, Markdown, lockfiles and renames excluded; total over 2× is also a breach).
  Reviewers report both numbers. The planner aims M tasks at about 300 lines and splits
  along the four named patterns. Value stays 400. | form: skill (config description,
  budgets.md, forge-review, plan-epic, new review scenario 4) | evidence: R009, R013,
  R014 F1, T002, T009, T010, T018 | applied: yes
- [x] Parallel worktrees: at most one of the parallel tasks may touch shared root config.
  A task that adds a dependency runs alone. | form: skill (delegate/parallel.md) |
  evidence: 8467563, package.json patch conflicts | applied: yes
- [x] Orchestrator rule 1 gets one exception, the unblock hotfix: a harness or test-infra
  defect that turns checks red for every task, fixed in 15 lines or fewer, committed
  alone as `harness: <cause>`, with a regression-test task if the fix has no test. The
  delegate skill documents the agent reload workaround. | form: skill (orchestrator.md,
  delegate SKILL.md) | evidence: 8467563, becc961 | applied: yes

Proposed tasks for E023 (larger than a retro edit, or in `tools/`):
- P1 **Diff budget command**: a new `harness:diff` script prints production and total lines of
  the staged diff using the budgets.md exclusions. AC: fixture test per exclusion; error
  over `task_diff_lines` or over 2× the total; forge-review step 3 and delegate step 5
  name it.
- P2 **Reviews folder within dir_files**: the scaffolder writes reviews to
  `forge/reviews/E###/`, existing reviews move there, and links and skills are updated.
  AC: `harness:check` clean with 30 reviews. Could fold into T086/T087. Priority p0.
- P3 **One determinism ban**: extend the Biome GritQL ban to `src/run` and delete
  `BANNED_GLOBALS` from `tests/architecture/checker.ts`. AC: `model.window` and
  `{ window: 1 }` pass; bare `window`, `Date.now()` and `Math.random()` fail in both
  folders.
- P4 **Worktree node_modules reuse**: when the worktree's `package.json` matches the main
  tree, link `node_modules` (a junction on Windows) instead of running `npm ci`. AC: tsc,
  Biome and Vitest pass in a linked worktree; setup time is in the Log.

T018 decision: under the new measure T018 has 358 production lines (583 in total). That
is within 400 and within 2×. R014 F1 is resolved by this budget change, with no split.
Next step: a round-2 review that confirms F1, plus the R014 F2 note in T023.

## Deletions

- Pruned the duplicated Parallel work procedure from `docs/harness/orchestrator.md`. It
  is now one line pointing to `parallel.md`, which offsets the hotfix lines.
- Proposed: delete the regex determinism ban (P3).
- For the orchestrator: delete the stale, git-ignored `.claude/worktrees/INDEX.md`. It
  was generated before 8467563 and is no longer regenerated.
- No skill was retired: all five were used in this period.

## Budget overrides

None active (`budget_override` and `budget-override:` appear only in docs, tools and
tests that describe the syntax).
