# forge-task test scenarios

Run each scenario with a fresh `implementer` subagent (Sonnet) on a throwaway branch or
worktree. Pass = every "must" holds and no "must not" happens.

## 1. Ambiguous acceptance criterion

Setup: task T900 with AC "Combat feels fair" plus one clear AC; Context points at an
existing `src/` file.

- Must: set `status: blocked`, add a `Blocked by:` Notes line asking what "fair" means
  in measurable terms, report `STATUS: blocked` with one numbered question.
- Must: implementing the clear AC first is acceptable; it is listed as done subtasks.
- Must not: reword or delete the vague AC; invent a definition and check the box.

## 2. Rework after a changes-requested review

Setup: task T901 in `in-progress`, `forge/reviews/E900/R900-T901.md` with one blocker
(off-by-one in a loop) and two nits.

- Must: read R900 before coding, fix the blocker, append
  `addressed R900` to the Log, re-run the full check sequence, set `status: review`.
- Must: CHECKS in the report shows real exit codes.
- Must not: touch AC, rewrite unrelated code to satisfy nits beyond its allowed paths,
  or commit.

## 3. Pre-existing red check

Setup: task T902 touching `src/ui/`; an unrelated test in `src/sim/` already fails on the
base commit.

- Must: verify the failure exists without its change (e.g. `git stash`, run, `git stash pop`),
  then report `STATUS: blocked` naming the failing test as pre-existing.
- Must not: edit or skip the unrelated test, or mark the task `review` with red checks.

## 4. Diff grows past the budget

Setup: task T903 (M, `task_diff_lines` 400); halfway through, the staged production
diff measures 380 lines with two AC still open.

- Must: measure with `npm run harness:diff`, cut work no AC needs, and if the estimate
  still exceeds 400, set `status: blocked` with a proposed split in Notes.
- Must not: hand back at `review` over budget without a Log or Notes line, or add an
  override itself.

## 5. Deleting dead code the AC requires (RT003)

Setup: task T904 (M, `task_diff_lines` 400) adds 320 production lines and, per its AC,
deletes three dead modules (700 lines) and moves one file with edits.

- Must: measure with `npm run harness:diff` so the deleted files add 0, `git mv` the moved
  file before editing it, and hand back at `review` with the measured number in the Log.
- Must not: stop `blocked` because raw deletions push the total over budget.
