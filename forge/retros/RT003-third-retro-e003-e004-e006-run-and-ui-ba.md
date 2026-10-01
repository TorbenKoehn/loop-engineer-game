---
id: RT003
title: "Third retro: E003, E004, E006 run and UI batch"
summary: "18 tasks done, 18/18 approved first round. Allowed paths now include companion docs and files; deleted dead files are free in the diff budget; grown Notes trigger a re-size."
keywords: ["retro", "diff-budget", "allowed-paths", "doc-drift", "sizing", "parallel", "e006", "e004"]
type: retro
status: active
updated: 2026-10-01
related: ["RT002-second-retro-e005-content-e002-combat-sa.md", "../epics/m0/E024-harness-upkeep-2/EPIC.md"]
---

# RT003: Third retro: E003, E004, E006 run and UI batch

Scope: commits after 5b100c6 (RT002) up to 8d7ad10. Done: T005, T040, T022, T099,
T023, T041, T055, T042, T025, T056, T026, T043, T058, T044, T027, T100, T028, T048.
T059 cancelled and split into T100 + T101 (4fac0b6). Reviews R033-R050.

## Contents

What Went Well · What Went Wrong · Learnings · Actions · Deletions · Budget overrides

## What Went Well

- **Numbers**: 18 tasks done (16 Opus, 2 Sonnet). First pass: 18/18 approved in round 1
  (100%, up from 69%). 18 reviews, 1.0 rounds per task: 0 blockers, 0 majors, 27 minors,
  19 nits. Attempts: 1.0 per task, and every Log has its `started attempt 1` line.
  Escalations to Opus: 0, none due (both Sonnet tasks passed). Re-plans: 1 (T059).
  Blocked: 2 (T022, a pinned sandbox test outside its paths; T055, scope). Lint: 0
  errors, 20 warnings (budget 25; 15 at RT002). Active overrides: 0 (lint shows 0 info).
- RT002 actions held:
  - Review staging: 0 findings about unstaged or generated files in R033-R050, down
    from 6 of 18 reviews.
  - Diff self-check: 10 of 18 Logs record a measured production diff. No unflagged
    breach reached review: T100 logged 482+/894- before review, so R048 F1 was a minor.
  - Hub rule: T099 (RT002 P1) removed the `en.ts` hub edit, and 0b0e18b union-merges
    `areas.gen.ts`, so no strings conflict recurred. P3 (spawnDefs docs) is done
    (f2dc8b2).
- Keep: pure-logic Opus tasks with mutation-checked tests (T041 Log) and AC proven by
  named tests. T028 and T048 updated their behaviour docs in scope (`event-log.md`,
  `sim-core.md`, `run-state.md`), and R049 and R050 raised no doc finding.

## What Went Wrong

1. **Docs drift because implementers may not touch them.** Evidence: 8 of 18 reviews
   raise a doc follow-up (R034 F1, R035 F1, R038 F1, R039 F3, R041 F1, R043 F1, R044
   F1, R046 F1). R043 F1 says R041 F1 is "still open". At least 7 task Logs say "Doc
   follow-up (outside allowed paths)". It took 4 gardener commits (f2dc8b2, ebe1a4a,
   78e0291, 3f0074a); R046 F1 (`shop.ts` missing from run-state.md `related_code`)
   is still open. The same narrow scope stopped T055 (`en-ui.ts`, `areas.gen.ts`,
   `tests/e2e/shell.spec.ts`), T022 (a pinned sandbox test) and T100 (needed approval
   for `en-combat.ts`, `main.tsx`, `index.html`).
   → Why: delegate step 3 said "Context paths plus their tests and docs". Context
   lists the code to read, not the files a change has to touch with it. forge-task
   step 6 requires the doc update, but the prompt forbade it. Root cause: the
   allowed-path rule did not list companion files.
2. **UI tasks under-sized, and their scope grew after planning.** Evidence: T098 needed
   2309 production lines (RT002). T059 overran the 60-turn limit and its diff, and was
   split (4fac0b6). Even its first half, T100, measured 1378 production lines (R048
   F1). T059 started with 5 AC plus six orchestrator obligations in Notes: R039 F2,
   R045 F1 and F2, and three T042 wiring notes (sandbox migration, `rafClock` fix,
   `combatInput`, dev-only route).
   → Why: (a) plan-epic had no split rule for a screen's components plus its route,
   e2e test and removal of what it replaces; (b) review follow-ups were appended to an
   unstarted task with no re-size (RT002 P4, never applied); (c) the budget counted
   deleted dead files (R048 F1) and undetected moves. With deleted files excluded,
   T100 measures 552 (`git diff --numstat -M --diff-filter=d 59d4063^ 59d4063`).
   Root cause: no sizing check at start, and a measure that penalised required
   cleanup.
3. **Union consumers broke integration across tasks.** Evidence: `placeholder.tsx`
   handles every `Action` variant. T042 added `continue` while T055 ran in parallel
   (07fe82d, 2729120) and needed a fix after the merge. T043 (+15/-3), T044 (+8) and
   T048 (+2) each edited it again. The orchestrator now pastes "handle new Action
   variants in placeholder.tsx" into prompts by hand.
   → Why: parallel.md's exported-type edge rule existed, but T055's Context did not
   name `src/run/actions.ts`, so the edge was invisible. Root cause: a file that
   switches over a growing union is a hub file, and the hub list named only content
   files.

Also seen:
- Directory budgets force folder decisions ad hoc. `src/run` and `src/sim/combat` are
  at 14 of 15 files, `src/sim/combat/context` at 11 (lint). T028 moved
  `compaction.ts` into `context/` against its Context (R049 F1). R037 F4 flags it.
- T095 (`harness:diff`, p0 since RT002 P2) is still `ready` after 18 tasks. It touches
  `package.json`, so it must run alone, and every batch was parallel feature work.
- Routing is Opus-heavy (16 of 18). The 2 Sonnet tasks passed in round 1. The GDD
  misread pattern from RT002 did not recur.

## Learnings

- A path allow-list built from what to read misses what to write. Docs, string areas
  and union consumers move together with the code, so they belong in the same grant.
- A follow-up appended to another task's Notes is unplanned scope. Six of them turned
  an M task into two.
- A budget must not punish the cleanup that an AC demands. Measure what a reviewer has
  to read: deleted files and pure moves are cheap to review.
- 100% first-pass approval with 0 majors fits normal-size Opus tasks with explicit AC.
  It also means doc drift was rated minor. That was right while docs were out of
  scope. RT004 checks whether doc follow-ups drop now that they are allowed.

## Actions

- [x] Companion files in allowed paths. delegate step 3 grants docs whose
  `related_code` names a file in scope, the behaviour doc, the string area file with
  `areas.gen.ts`, `tests/e2e/<name>.spec.ts` for Playwright AC, and `placeholder.tsx`
  for a new `Action` variant. parallel.md adds `placeholder.tsx` to the hub files, and
  a companion doc that both tasks would edit goes to one of them. delegate tests.md
  scenario 4 is updated, scenario 5 added. | form: skill | evidence: R034-R046 doc
  findings, T055, T022, T100, T042/T055 | applied: yes
- [x] Deleted dead files are free. budgets.md "Measuring task diffs" and the forge-task
  step 5 command use `--diff-filter=d`; `git mv` before editing a moved file.
  forge-task tests.md has a new scenario 5. A T095 Notes line asks the planner to add
  the case to AC2 before start. | form: skill + doc | evidence: R048 F1, T100 |
  applied: yes
- [x] Sizing guard. delegate pre-flight: more than two Notes obligations added after
  planning → the planner re-sizes or splits first; a follow-up bigger than a Notes line
  gets its own task. plan-epic step 4: split a screen's components from its route, e2e
  and replacement; name the subfolder for new files when the target folder is at
  `dir_files` warn_at. | form: skill | evidence: T059, T098, T100, lint dir_files |
  applied: yes

Proposed tasks (new epic E024 "Harness upkeep 2", created; E023 is full):
- P1 **Regroup `src/run` and `src/sim/combat` below `dir_files` warn_at** (code move,
  sonnet, M, solo after the in-flight T032/T101/T049). AC: harness lint shows no
  `dir_files` warning for either folder; tests change only import paths; the moved
  files are listed in the `related_code` of `run-state.md`, `sim-core.md` and
  `event-log.md`; `npm run check` exits 0. Evidence: lint, R037 F4, R049 F1.
- P2 **`harness:diff` lists companion docs** (tool, after T095). AC: for each staged
  file named in a doc's `related_code` where that doc is not staged, it prints
  `companion: <doc>` and still exits 0 (vitest in a temp repo); forge-review step 3
  reads that line. This is the lint-level form of action 1. Evidence: 8 doc findings.
- P3 **Run T095 next, alone** (no new task): p0 since RT002, starved by parallel
  batches. Orchestrator scheduling only.

## Deletions

- parallel.md: removed `src/content/strings/en.ts` from the hub files. T099 removed
  that hub edit.
- delegate step 3: replaced the vague "plus their tests and docs" with the explicit
  companion list.
- For the orchestrator, second time: in `forge/HANDOFF.md`, "Retro 2 candidates"
  (consumed by RT002), the stale "In flight" entries (T020, T015, T096 are done) and
  the done follow-ups ("group epics by milestone": T086/T087; "review scaffolder
  titles": T086). This retro left them alone because the orchestrator edits HANDOFF
  concurrently.
- No skill was retired: all five were used in this period.

## Budget overrides

None active in frontmatter or code headers. The two Log-only overrides from RT002:
- T016 `task_diff_lines` 651: expired; the task is done and guards nothing.
- T098 `task_diff_lines` 2309: the reason ("throwaway sandbox until T059") holds until
  T101 makes the sandbox dev-only. It expires when T101 is done.
