---
id: RT002
title: "Second retro: E005 content, E002 combat, sandbox"
summary: "14 tasks done, 9/13 approved first round. Implementers measure the diff mid-task and stop over budget; parallel independence covers hub files and API edges; generated files are no review finding."
keywords: ["retro", "diff-budget", "worktrees", "parallel", "review-noise", "e005", "e002"]
type: retro
status: active
updated: 2026-10-01
---

# RT002: Second retro: E005 content, E002 combat, sandbox

Scope: commits after a9381c2 (RT001) up to 859711a. Done: T086, T087, T018 (round 2),
T019, T012, T014, T020, T011, T013, T015, T096, T021, T098, T016. Reviews R015-R032.

## Contents

What Went Well · What Went Wrong · Learnings · Actions · Deletions · Budget overrides

## What Went Well

- **Numbers**: 14 tasks done (8 Opus, 6 Sonnet). First pass: 9/13 approved in round 1
  (69%, down from 92%); T018 approved in round 2 (R015). 18 reviews, 1.29 rounds per
  task. 0 blockers, 5 majors (R021 F1, F2; R022 F1; R029 F1; R030 F1). Logged attempts:
  1.0 per task, but see friction 4. Escalations to Opus: 0 (2 were due). Re-plans 0.
  Blocked 1 (T086, pre-existing red from a long R015 title, resolved). Lint: 0 errors,
  15 warnings (budget 25; 6 at RT001). Overrides: 2 (T016, T098).
- RT001 actions held: reviewers now measure the diff the same way (R029 and R030 both
  report `numstat` production lines; 651 and 2309 reproduce from the commits). No
  `package.json` conflict this period. P2 (reviews per epic: T086, T087) and P3 (one
  determinism ban: T096, 41+/74-) landed, both approved in round 1.
- Opus logic tasks of normal size (T019, T020, T021 at 266 production lines, T012,
  T014) passed in round 1 with every AC proven by a named test. Keep it.

## What Went Wrong

1. **Oversized diffs reached review unflagged.** Evidence: R029 F1 (T016, 693
   production lines, "the Notes and Log never mention the breach"), R030 F1 (T098, 2337,
   "no budget exception in the task"; `sandbox.css` 886 lines of glows, keyframes and
   responsive extras). T098 hit the 60-turn implementer limit, as T002 did. → Why: the
   implementer first learns the size from the reviewer. forge-task said "restructure or
   override" but gave no command and no point to measure; the `harness:diff` command
   (RT001 P1, T095) is still `ready` at p1. T098 was scaffolded and started by the
   orchestrator in one commit (a551181), so no planner sized it. T016 was planned before
   RT001's ~300-line aim. Root cause: no in-flight measurement and no stop rule.
2. **Parallel worktrees still integrate badly.** Evidence: `src/content/strings/en.ts`
   got one import plus one spread in each of 14d0ece, e1cd053, 5f4c96b, fe438f9 and
   3d80bae, and each parallel content task conflicted there (R024 "the en.ts merge with
   T011 compiles"). T021 added `EncounterSetup.spawnDefs` while T098 ran in parallel;
   T098 needed a rework after the merge (T098 Log "adapter fills spawnDefs after
   T021"). A worktree agent sent to rework in the main tree was blocked by the
   permission classifier (HANDOFF). WIP reached 4 in-progress once (orchestrator).
   → Root cause: parallel.md judged independence by disjoint Context paths only. Hub
   files and exported-type edges are invisible to that test. It had no rework path for
   worktree tasks. Its step 2 kept statuses out of the main tree, so `harness:check`
   could not see worktree WIP; practice had already diverged (2d730f6 and 07f31b4
   commit `in-progress` in the main tree).
3. **Review noise from bookkeeping files, and a broken skill step.** Evidence:
   unstaged generated files were raised in 6 of 18 reviews (R016 F2, R021 F2 as a
   major, R022, R024, R031 F1, R032). R023 confirms R021 F2 was orchestrator
   bookkeeping. The scripted path rewrite in T087 (2722ef5) turned step 2 of
   forge-review and forge-task into `###\``: since then neither skill has a working
   command to find prior reviews. R016 F1 caught the same garbling in the harness README
   but not in the skills. → Root cause: forge-review rated every unstaged file a major
   with no exemption for generated files, and the orchestrator regenerated BOARD.md
   after `git add -A`.
4. **The escalation ladder was not followed or not logged.** Evidence: T011 and T013
   (Sonnet) got changes-requested (R021, R022). The ladder (workflow.md) and delegate
   scenario 2 require a fresh Opus run, but both Logs go straight to "addressed R0##"
   with no `R### changes-requested` line and no `started attempt 2`. The same applies
   to T016 and T098. Attempts and escalations above are therefore undercounted. No
   action this retro (cap 3). The orchestrator should log every round from now on, and
   RT003 checks it.

Also seen: both Sonnet rejections (T011 `stash: 0`, T013 invented unlock ids) were GDD
misreads whose tests were built from the same misreading (`toMatchObject` skipped stash;
unlock ids derived from the doc cell). This is RT001's "independent oracle" lesson,
applied to data tasks. Watch it in RT003; if it recurs, add a plan-epic AC line.

## Learnings

- A budget that only the reviewer measures costs a full round and, when the breach is
  large, the implementer's turn budget. Measuring has to happen while the work is done.
- Disjoint file lists are a weak independence test. Registries that grow one line per
  feature, and exported types, couple tasks that never share a Context path.
- A finding the author cannot act on (generated files) trains reviewers and
  implementers to ignore the rule it hides behind. Exempt it precisely.
- Scripted bulk rewrites of harness text need a grep for the replaced pattern in the AC.

## Actions

- [x] forge-task step 5: measure production lines halfway and before handback with the
  budgets.md `numstat` command (inline until T095 lands); over budget → cut extras, then
  stop `blocked` with a proposed split; never hand back an unflagged breach. Repaired
  step 2 (`ls forge/reviews/*/*-T###.md`). New tests.md scenario 4. | form: skill |
  evidence: R029 F1, R030 F1, T098, 2722ef5 | applied: yes
- [x] delegate parallel.md: independence also needs no shared hub file (`en.ts`,
  `src/content/index.ts`) and no exported-type edge. Start = set `in-progress`, run
  `harness:check` (WIP), commit `forge: start`. Rework of a worktree task happens in
  the worktree (`git apply -R --index`, then re-apply). The worktree note says "edit only
  inside this worktree". New tests.md scenario 4. | form: skill | evidence: en.ts
  commits, T098 Log, R028 F1, HANDOFF | applied: yes
- [x] forge-review step 3: only unstaged files inside the task's allowed paths are a
  major; generated files, HANDOFF.md and other tasks' files are ignored. Repaired step 2.
  delegate step 6.1 runs `harness:check` before `git add -A`, so generated files are
  staged before review. New tests.md scenario 5. | form: skill | evidence: R016, R021,
  R022, R024, R031, R032 | applied: yes

Proposed tasks (E023 is full at 12 tasks: open a new m0 harness epic, e.g. "Harness
upkeep 2", or close E023 and continue there):
- P1 **Content string registry without a hub edit** (code, `src/content`): adding a
  content area's strings (and its bundle entry) needs no edit to `en.ts` or
  `src/content/index.ts`, e.g. a generated barrel. AC: a new `en-<area>.ts` is picked up
  with no hub edit; `tsc` still rejects an unknown string key; a test fails on a
  duplicate key across area files. Priority p0 before the next parallel content batch.
- P2 **Raise T095 (`harness:diff`) to p0**, then replace the inline `numstat` command in
  forge-task step 5 and forge-review step 5 with it. No new task.
- P3 **Docs for `spawnDefs`** (R028 F1, never filed): document
  `EncounterSetup.spawnDefs` and the dropped-spawn event convention in
  `docs/architecture/sim-core.md` and `event-log.md`. Doc-gardener scope.
- P4 **Ad hoc tasks get planner sizing** (harness text, next retro or with P2): in
  orchestrator.md, a user-requested task is scaffolded by the planner, or split by it,
  before it starts. Evidence: T098 (a551181).

## Deletions

- Removed the worktree `npm ci` line from `.claude/agents/implementer.md`. The delegate
  worktree note carries it, so it now lives in one place (T097 will change it).
- Replaced parallel.md's "do not edit status in the main tree" rule. Practice had already
  dropped it, and it hid worktree WIP from the harness.
- For the orchestrator, in `forge/HANDOFF.md`: delete "Retro 2 candidates" (consumed
  here) and the pending follow-ups that are done ("group epics by milestone": T086/T087;
  "review scaffolder titles": T086).
- No skill was retired: all five were used in this period.

## Budget overrides

- T016 `task_diff_lines` 651 (R029 measured 693 before rework): sizing miss, validator
  rules 1-6 as one unit. The task is done and the reason was valid once; it guards
  nothing now. Lesson recorded in friction 1.
- T098 `task_diff_lines` 2309: the user asked to see the game early; throwaway sandbox,
  with components reused in T059. The reason still holds until T059 replaces the sandbox.
  T059 should delete or absorb `src/ui/sandbox` and `sandbox.css`.
