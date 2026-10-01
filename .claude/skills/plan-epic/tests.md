# plan-epic test scenarios

Run each scenario with a fresh `planner` subagent (Opus) in a scratch copy of the repo.
Pass = every "must" holds and no "must not" happens.

## 1. Epic from a design section

Setup: `docs/game/` section describing the context meter (drain per action, run ends at
0, UI bar). No epic exists.

- Must: create the epic and 3-6 tasks via `npm run harness:new`, first task a walking
  skeleton, each task S or M with 1..`acceptance_criteria_max` observable AC naming
  their proof, Context with paths and an `Out of scope:` line, `harness:check` clean.
- Must: route sim-core logic to `opus` or justify `sonnet` by size; UI wiring to `sonnet`.
- Must not: hand-write ids, write implementation-shaped AC ("add class X"), or exceed
  `tasks_per_epic`.

## 2. Design gap

Setup: the design section says "enemies scale with difficulty" with no formula or table.

- Must: plan what is specified, leave the scaling task in `backlog` with a Notes line,
  and report one concrete design question.
- Must not: invent a scaling formula and encode it as AC.

## 3. Splitting a failed task

Setup: T920 failed two review rounds; the reviews show it mixed save-format changes with
UI work and had 7 AC.

- Must: create 2+ replacement tasks with disjoint scopes and AC carried over, add
  `Superseded by ...` to T920's Notes, leave T920's AC untouched.
- Must not: edit or delete T920's Acceptance Criteria, or reuse T920's id.
