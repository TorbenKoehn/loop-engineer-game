---
name: forge-task
description: Executes one forge task file end-to-end - read the spec and prior reviews, implement within scope, run the check sequence, record AC evidence in the Log, set status review. Use when implementing or reworking a task T### from forge/epics/.
metadata:
  keywords: [forge, task, implementation, checks, evidence]
  updated: 2026-10-01
---

# Executing a forge task

Critical rules (read before anything else):
- One task. Only the paths your delegation prompt allows. The task's Out of scope stays out.
- Acceptance Criteria are frozen: check boxes, never edit, delete or weaken them.
- Never weaken tests, lint rules or budgets to get green. Never hand-edit `INDEX.md`,
  `forge/BOARD.md` or `docs/harness/budgets-table.md`.
- Do not commit and do not set `done`. You end at `review` or `blocked`.
- Stop and report instead of guessing (see "Stop conditions").

## Steps

1. **Read the spec.** The task file in full, then its epic's Goal (`EPIC.md`), then the
   Context paths. Read further only where those lead. Do not browse `docs/research/`.
2. **Read prior reviews.** `ls forge/reviews/*/*-T###.md`. If any exist, list every
   blocker and major finding; they come first in this attempt.
3. **Claim it.** If the status is still `ready` (worktree runs), set `in-progress` and
   append `- <date>: started attempt N (<model>)` to the Log. Otherwise the
   orchestrator already did.
4. **Plan.** If Subtasks are empty or stale, write your checklist there (within
   `subtasks_per_task`). Check items off as you go.
5. **Implement the smallest change that meets every AC.**
   - Logic: write the failing vitest test first, then the code.
   - Follow `docs/architecture/` conventions for `src/`, `tools/harness/README.md`
     for tools.
   - Diff budget: measure production lines when about half the subtasks are done and
     again before handback. Stage your allowed paths (`git add -A -- <paths>`), then
     run `npm run harness:diff` (prints `production=<n> total=<m>`, exits 1 on a
     breach). Dead code you delete is free; `git mv` before editing a moved file
     (budgets.md#measuring-task-diffs). Over
     `task_diff_lines`: cut what no AC needs (polish, extras), restructure per
     `docs/harness/budgets.md`; still over → stop
     with `blocked` and a proposed split. Never hand back an unflagged breach (RT002);
     overrides are the orchestrator's call.
   - New `TODO`/`FIXME`: `TODO(T###): ...` with an existing task id.
6. **Update docs.** Any doc whose `related_code` lists a file you changed, and any doc
   describing behaviour you changed: fix it and bump `updated`.
7. **Run the check sequence** from `CLAUDE.md`, in order, stopping at the first failure.
   Fix and re-run until all exit 0. `check` also runs build and e2e when
   `src/` or `tests/e2e/` changed. A spec or golden that broke because fight outcomes moved: fix it
   if your prompt allows the path (goldens: `npm run golden:update`), else report it.
8. **Record evidence.** For each AC: check its box and append a Log line naming the
   proof, e.g. `- 2026-10-02: AC2 verified: npx vitest run context-meter (14 passed)`.
   An AC you cannot prove is not checked; report it.
9. **Hand back.** Set `status: review`, bump `updated`, append
   `- <date>: review requested`. Then write the report.

## Stop conditions

Set `status: blocked`, add `Blocked by: <one-line question>` to Notes, append a Log line,
and report `STATUS: blocked` when:
- an AC is ambiguous or contradicts another AC, the design doc or a prior review;
- a `depends_on` task's output is missing or broken;
- meeting an AC needs files outside your allowed paths;
- a check fails for reasons unrelated to your change (pre-existing red);
- a budget cannot be met without a design decision.

Do not half-implement around the problem. Partial work stays in the tree; say which
subtasks are done.

## Rework after changes-requested

- Address every blocker and major from the latest review, in order. Minor and nit are
  optional; do them only if trivial and in scope.
- Do not argue with a finding in code comments. If you believe a finding is wrong, say
  so in the report under NOTES with evidence; still do not edit AC.
- Append `- <date>: addressed R### (<n> findings)` to the Log.

## Report

Use the block from `docs/harness/delegation.md#report-format`. CHECKS lists the real
exit codes from your last run. Keep it under 40 lines; detail belongs in the task file.
