---
id: RT004
title: "Fourth retro: E007, E008, E009 sim, save and screens"
summary: "14 tasks done, 12/14 approved first round. Implementer maxTurns 60 to 90; fight-outcome tests and e2e join allowed paths and verification; CSS gets its own 300-line cap."
keywords: ["retro", "max-turns", "e2e", "diff-budget", "css", "bookkeeping"]
type: retro
status: active
updated: 2026-10-01
related: ["RT003-third-retro-e003-e004-e006-run-and-ui-ba.md", "../epics/m0/E024-harness-upkeep-2/EPIC.md"]
---

# RT004: Fourth retro: E007, E008, E009 sim, save and screens

Scope: commits after d4a2b36 (RT003) up to 4c13d37. Done: T049, T101, T032, T050, T051,
T063, T033, T046, T029, T064, T052, T034, T095, T024. Reviews R051-R066.

## Contents

What Went Well · What Went Wrong · Learnings · Actions · Deletions · Budget overrides

## What Went Well

- **Numbers**: 14 tasks done (11 Opus, 3 Sonnet). First pass: 12/14 approved in round 1
  (86%, down from 100%). 16 reviews, 1.14 rounds per task: 0 blockers, 2 majors, 22
  minors, 12 nits. Both majors were process, not code: R052 F1 (diff counting), R059 F1
  (no Log evidence). Attempts: 1.0 per task. Escalations to Opus: 0. Re-plans: 0.
  Blocked: 3 (T063 diff budget, T033 seed test outside its paths, T095 AC-named file
  outside its paths). maxTurns hits: 5 of 11 Opus runs (orchestrator count; no Log
  records them). Lint: 1 error (R066 `fm_summary_chars` 224, committed in b6a267d), 22
  warnings (budget 25; 20 at RT003). Active overrides: 0 in files, 4 in task Logs.
- RT003 actions held:
  - Companion files: doc findings fell to 6 of 16 reviews (from 8 of 18). Only R054 F1
    blames scope, and T032 started before RT003. T033 fixed R054 F1 in its own scope;
    T101 rewrote ui.md.
  - Deleted dead code is free: T095 encodes it in `harness:diff` with vitest cases; the
    T101 decision extends it to pure deletions in kept files (R052 F1 would not recur).
  - Sizing guard: no task started with more than two post-planning obligations.
  - RT003 P3: T095 ran (3f62459) and every Log since T095 reports its numbers.
- Keep: AC proven by named tests (T029, T034 Logs), sync SHA-256 checked against FIPS
  vectors (T050), goldens with readable diffs and an update command (T024).

## What Went Wrong

1. **Fight-outcome changes break tests outside the task, and e2e runs in no gate.**
   Evidence: T029 (06b6219) moved Trust loss; `combat.spec` (-20 vs -18 Trust) failed
   unnoticed until the T064 Log called it "pre-existing", and the orchestrator fixed it.
   T033 blocked on the seed-pinned p1-boss test in `src/run/combat.test.ts`; T046 edited
   the same seed search. T024's goldens needed regeneration after T034 merged. T095
   blocked on `delegate/SKILL.md`, a file its own AC4 named.
   → Why: e2e runs only when an AC names Playwright; `npm run check` has no e2e step;
   tests pinned balance (fixed seeds, `-20 Trust`). Root cause: no gate for e2e, and
   the companion list had no rule for outcome-pinning tests or AC-named files.
2. **Bookkeeping slips past manual checks.** Evidence: T046 reached review with checked
   AC and no evidence lines (R059 F1, major) though delegate step 5.4 checks this. The
   worktree merge lost T051's task-file edits; it was committed at status review with
   unchecked AC (ce96beb), then patched (3ca0a7d, 37e0365). R066 went in with a lint
   error (b6a267d, still red at HEAD). T064's override line had the wrong number
   (R063 F1).
   → Why: these checks live only in the delegate checklist and slip under parallel
   merges. Lint has no rule tying status, AC boxes and Log, and the Stop hook runs after
   the commit. Root cause: missing forge lint rules and no lint gate at commit.
3. **Budgets measure the wrong things.** Evidence: 5 of 11 Opus runs hit 60 turns (T032
   288 production lines, T033 250, T024 100, T063, T064) against 1 of 18 in RT003
   (T059). T049 (283) and T050 (300) did not. T063 (614, CSS 275) and T064 (712, CSS
   276) needed overrides. T024's total was 1252, of which 588 were generated JSONL.
   → Why: turns track total work (tests, docs, e2e), not production lines. RT003 moved
   companion docs into the implementer run, and the cap stayed. Declarative CSS and
   generated fixtures count like hand-written logic. Root cause: caps not recalibrated
   after scope grew, and the measure ignores file kind.

Also seen:
- Doc follow-ups still open: save.md `lastRun` (R051 F4, raised again as R055 F3),
  stunDurPct on compaction Stun (R058 F1), combat.md dmgPct (R058 F2), content-model.md
  passive custom hooks (R064 F1). No gardener run since RT003.
- T046's major went back to the same Sonnet agent, not a fresh run on Opus as the ladder
  says. That fits a bookkeeping-only major; P2 removes the case.
- RT003 P1 (regroup `src/run`, `src/sim/combat`) and P2 (companion docs in
  `harness:diff`) are still unscaffolded. `dir_files` is at 14/14/12 for `src/run`,
  `src/sim/combat` and `src/sim/combat/context`.

## Learnings

- Widening an agent's scope raises its turn use. Budgets tied to scope move with it.
- A checklist step the orchestrator must remember under merge load fails about once
  every 4 tasks (T046, T051, R066, T064). It belongs in lint.
- Tests that pin balance act as hub files: any sim task can break them. Only goldens
  should pin outcomes, and they need a regeneration command.
- The drop to 86% first pass is process noise. Code findings stayed minor.

## Actions

- [x] Implementer `maxTurns` 60 → 90: `subagent_turns_impl` in harness.config.json,
  implementer.md, research row, regenerated budgets-table.md. The workflow ladder logs
  `maxTurns hit, resumed` so RT005 can measure hits. Decision: raise the cap, do not
  shrink tasks. T024 hit it at 100 production lines, and every resumed run was approved
  first round. | form: budget (lint-enforced) | evidence: T032, T033, T063, T064, T024 |
  applied: yes (agents reload on session restart)
- [x] Fight-outcome companions and e2e in verification. delegate step 3 allows AC-named
  files and, for outcome changes, `src/run/combat.test.ts`, `tests/e2e/combat.spec.ts`
  and goldens via `golden:update`. Step 5 runs `build` and `e2e` for `src/` changes, and
  again on main after a worktree merge. forge-task step 7 does the same. testing.md:
  only goldens pin outcomes. tests.md scenarios: delegate 6, forge-task 6. | form: skill
  + doc (lint form: P1) | evidence: T029/T064, T033, T046, T024, T095 | applied: yes
- [x] CSS has its own cap: budgets.md "Measuring task diffs" gives stylesheets a
  300-line cap outside `production`. plan-epic sizes a screen's CSS separately. Until
  P4 lands, report `css=<n>` and subtract it. T064 without CSS is 436 lines, a normal
  near-miss. | form: doc + skill (tool form: P4) | evidence: T063, T064 | applied: yes

Proposed tasks for E024 (with RT003 P1, P2 still to scaffold):
- P1 (p0, sonnet, S) **`npm run check` runs build and e2e** (`tools/check/run.ts`). AC:
  after vitest, check runs `vite build` and `playwright test` when the diff touches
  `src/` or `tests/e2e/`, else prints the skip reason; a failing spec makes check exit
  non-zero; CLAUDE.md's check line names e2e. The e2e lines in delegate step 5 and
  forge-task step 7 are then removed. Evidence: T029/T064.
- P2 (p1, sonnet, S) **Forge lint: status, AC and Log agree.** AC: error when a `done`
  task has an unchecked AC; error when a `review` or `done` task has a checked AC n
  without a Log line `AC<n> verified`; error when the Log has `done (R###)` and the
  status is not `done`; vitest per rule; T051's Log gets per-AC lines. Evidence: T051,
  R059 F1.
- P3 (p1, sonnet, S) **Lint gate at commit.** AC: a PreToolUse hook on Bash
  `git commit` runs `harness:lint` and blocks on any error (vitest with hook input); a
  clean tree commits. Evidence: R066 committed red (b6a267d), T051 (ce96beb).
- P4 (p1, opus, M) **`harness:diff` counts CSS and skips generated files.** AC: prints
  `production=<n> css=<c> total=<m>`; `*.css` leaves `production`; new budget
  `task_css_lines` 300 with check and test, exit 1 above it; `total` drops
  `tools/golden/fixtures/**`, `**/*.gen.ts` and generated INDEX/BOARD/budgets-table
  files; budgets.md's interim sentence is removed. Evidence: T063, T064, T024.

## Deletions

- budgets.md: removed the T100 evidence numbers and the undetected-move note (3 lines),
  now covered by T095's vitest cases. A Contents line clears its `md_toc_over_lines`
  warning.
- E024 EPIC.md: the two orchestrator proposal bullets are now P1 and P2, replaced by a
  pointer.
- Not deleted: plan-epic was unused this period (no plan commit since d4a2b36). It is
  needed to scaffold E024, and this is its first idle retro.

## Budget overrides

None in frontmatter or code headers. Log-only:
- T098 `task_diff_lines` 2309: expired. T101 made the sandbox dev-only.
- T063 614 and T064 712: expired (tasks done). The CSS cap replaces this kind of
  override.
- T024 total 1252: the reason (generated goldens) holds until P4 lands.
