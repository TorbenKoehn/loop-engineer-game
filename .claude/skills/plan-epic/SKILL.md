---
name: plan-epic
description: Decomposes an epic or game design section into ordered S/M forge tasks within budgets, writing goals, context paths and checkable acceptance criteria via the scaffolder. Use when starting an epic, re-planning a failed task, or splitting an oversized task.
metadata:
  keywords: [planning, epic, decomposition, acceptance-criteria, tasks, forge]
  updated: 2026-10-01
---

# Planning an epic

Critical rules:
- Every epic and task is created with `npm run harness:new`; never hand-pick ids.
- A task is one subagent run, one review, one commit. Size S or M; anything bigger is
  split. Limits: `tasks_per_epic`, `subtasks_per_task`, `acceptance_criteria_max`,
  `task_diff_lines`, `task_files_changed` (values: `docs/harness/budgets-table.md`).
- Acceptance criteria are observable outcomes, checkable by a command, a test name or a
  visible result. Once work starts they are frozen (lint `ac_decrease`), so get them right now.
- Do not invent game design. Missing or contradictory design → report a question.

## Steps

1. **Understand the outcome.** Read the input (EPIC.md or the `docs/game/` section),
   then the relevant `docs/architecture/` docs via their INDEX. One sentence: what can
   the player or developer do after this epic that they cannot do now?
2. **Create or complete the epic** if needed:
   `npm run harness:new -- epic --title "<outcome>" --priority p1`. Fill Goal, Scope,
   Out of Scope, Definition of Done (epic-level, checkable). Replace the placeholder
   summary with the outcome. Check `epics_active` before setting `in-progress`.
3. **Slice vertically.** Prefer thin end-to-end slices over layers ("enemy spawns and
   is visible" beats "enemy data model"). The first task is a walking skeleton that
   proves the path works. Order slices so each leaves the game runnable.
4. **Size each slice.**
   - S: one concern, within `route_sonnet_max_diff_lines` and `route_sonnet_max_files`.
   - M: within `task_diff_lines` and `task_files_changed`.
   - Bigger, or more than `acceptance_criteria_max` AC: split again.
   - Size by production lines (budgets.md#measuring-task-diffs); aim M at ~300, and a
     screen's CSS separately at 300 or less (T063, T064). Split
     these: a type module plus its consumers (T009), one template per kind of a union
     (T010), API types plus the loop using them (T018), adopting a tool or rule plus
     fixing every existing finding (T002), a screen's components plus its route, e2e
     test and removal of what it replaces (T098, T059 → T100 + T101).
   - New files go where? If the target folder is at `dir_files` warn_at, the Context
     names the subfolder for them (`src/run`, `src/sim/combat` at 14 of 15, RT003).
5. **Create each task:**
   `npm run harness:new -- task --epic E### --title "<outcome>" --size S --model sonnet --priority p2`.
   Then fill:
   - **summary/keywords**: the outcome and the words an agent would grep for.
   - **Goal**: one paragraph, the outcome and why it matters.
   - **Context**: 2-5 paths to read first (no pasted content), then
     `Out of scope: <what a reasonable implementer might add but must not>`.
   - **Acceptance Criteria**: rules below.
   - **Subtasks**: optional hints; the implementer may rewrite them.
   - **depends_on**: only real blockers; parallelizable tasks have disjoint Context paths.
6. **Route the model.** `opus` for cross-cutting changes, sim-core or balance logic,
   unclear design space, or anything over the Sonnet thresholds; `sonnet` when the task
   file fully specifies the change.
7. **Ready check.** Set `status: ready` only when the Definition of Ready in
   `docs/harness/workflow.md` holds; otherwise leave `backlog` with a Notes line saying
   what is missing.
8. **Run `npm run harness:check`** and fix every finding in your files.
9. **Report** the task list (`T### | title | size | model | depends_on | status`) and
   open design questions.

## Writing acceptance criteria

| Rule | Bad | Good |
|---|---|---|
| Observable | "Combat works well" | "`npx vitest run combat-resolve` passes, covering tie, overkill and empty board" |
| Outcome, not implementation | "Add a `ContextMeter` class" | "A run whose context reaches 0 ends with outcome `context-exhausted`" |
| One check per item | "Meter drains and UI updates and saves" | three separate items, or three tasks |
| Names its proof | "Is tested" | "Test `drains one point per action` exists and passes" |
| Behaviour for game features | only unit tests | "In the browser, starting a run shows the context bar at 100" (Playwright once available) |

Each AC must fail before the task and pass after it. Add a regression AC for bugs:
"Test `<name>` reproduces the bug and passes".

## Re-planning and splitting

- Input is a failed or oversized task plus its reviews and Log.
- Find the cause first: AC too vague, hidden dependency, or task too big.
- Create replacement tasks (new ids), carry over what is still valid, and add
  `Superseded by T###[, T###]` to the old task's Notes. Never edit the old task's AC.
