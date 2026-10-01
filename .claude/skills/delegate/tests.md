# delegate test scenarios

Run each scenario in the main session (Opus) on a scratch copy of the repo with fixture
forge data and a stubbed implementer report. Pass = every "must" holds and no "must not"
happens.

## 1. Report claims green, typecheck is red

Setup: implementer returns `STATUS: review`, `CHECKS: tsc=0 ...`, but `npx tsc --noEmit`
fails on a file it changed.

- Must: run the check sequence itself, detect the failure, resume the same implementer
  once via SendMessage with the failing output, and not count a new attempt.
- Must not: stage, spawn the reviewer, or set any status based on the report alone.

## 2. Escalation after changes-requested on Sonnet

Setup: T930 (`model: sonnet`), attempt 1 reviewed as `changes-requested` in R930
(1 blocker).

- Must: set `in-progress`, Log the review, start attempt 2 with a fresh implementer,
  Agent `model: opus`, prompt naming R930 as input.
- Must not: resume the old Sonnet agent, edit the task's AC, or fix the blocker itself.

## 3. Choosing parallel vs sequential

Setup: three ready tasks; T940 and T941 both list `src/sim/combat.ts` in Context; T942
lists only `src/ui/**`.

- Must: run T940 and T941 sequentially; T942 may run in parallel with one of them via
  `isolation: worktree`, following parallel.md (clean tree, HANDOFF entry, patch back,
  review in the main tree).
- Must not: run T940 and T941 at the same time, or review a worktree task before its
  patch is applied in the main tree.

## 4. Hidden coupling between parallel candidates

Setup: ready T943 (Context `src/run/shop/**`) and T944 (`src/run/events/**`) both add
an `Action` variant handled in `src/ui/screens/placeholder.tsx`; T945 changes an
exported sim type that ready T946's UI adapter imports.

- Must: run T943 and T944 one after another, and T945 and T946 one after another.
- Must not: treat disjoint Context globs alone as independence.

## 5. Companion files and grown scope (RT003)

Setup: ready T947 (Context `src/run/rewards.ts`) changes reward behaviour, adds an
`Action` variant and UI text; `docs/architecture/run-state.md` lists `src/run/rewards.ts`
in `related_code`. Ready T948 has four orchestrator Notes from later reviews. Ready
T950 is an M screen task created before RT003.

- Must: give T947's prompt `run-state.md`, its string area file with `areas.gen.ts`, and
  `src/ui/screens/placeholder.tsx` as allowed paths; send T948 and T950 to the planner
  to re-size or split before starting them.
- Must not: start T947 with Context paths only, or start T948 or T950 as planned.

## 6. Sim change ripples into e2e and goldens (RT004)

Setup: ready T949 (Context `src/sim/combat/context/**`) changes when compaction fires;
`tests/e2e/combat.spec.ts` asserts a Trust number and `tools/golden/fixtures/` pins logs.

- Must: allow `src/run/combat.test.ts`, `tests/e2e/combat.spec.ts` and
  `tools/golden/fixtures/**` in the prompt; in verification `npm run check` (runs build and
  e2e), and run it again on main after merging the worktree.
- Must not: send T949 to review before `npm run check` passed on main after the merge.

## 7. Worktree results with generated files (RT005)

Setup: T951 and T952 ran in parallel worktrees; both added a string area, so both
changed `src/content/strings/areas.gen.ts`. T952 hit maxTurns while T951 was merged.

- Must: resume T952 with a message that asks it to append `maxTurns hit, resumed` in its
  worktree; export each patch without `*.gen.ts`, then run `npm run content:index` and
  stage `areas.gen.ts` after each apply, before `npm run check`.
- Must not: commit a Log line to T952's task file in the main tree, or apply or merge a
  generated file from a worktree.
