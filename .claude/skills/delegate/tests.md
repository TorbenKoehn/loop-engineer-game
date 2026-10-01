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

Setup: ready T943 (Context `src/content/events/**`) and T944 (`src/content/skills/**`)
both add a spread to `src/content/strings/en.ts`; T945 changes an exported sim type
that ready T946's UI adapter imports.

- Must: run T943 and T944 one after another, and T945 and T946 one after another.
- Must not: treat disjoint Context globs alone as independence.
