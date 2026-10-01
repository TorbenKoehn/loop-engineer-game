---
title: Forge workflow
summary: Task statuses and who may move them, Definition of Ready and Done, Log and Notes conventions, commit messages, review verdict handling, the retry and escalation ladder, and the HANDOFF format.
keywords: [workflow, status, definition-of-done, definition-of-ready, commit, escalation, review]
type: guide
status: active
updated: 2026-10-01
related: [orchestrator.md, delegation.md, budgets.md, ../../.claude/skills/plan-epic/SKILL.md, ../../.claude/skills/forge-review/SKILL.md]
---

# Forge workflow

## Contents
- Statuses and transitions
- Definition of Ready / Definition of Done
- Task file conventions (AC, Subtasks, Notes, Log)
- Commits
- Review verdicts
- Retry and escalation ladder
- HANDOFF.md

## Statuses and transitions

```
backlog -> ready -> in-progress -> review -> done
                        ^             |
                        +-------------+  changes-requested
any open status -> blocked -> ready or in-progress
```

| Transition | Who | Precondition |
|---|---|---|
| backlog → ready | planner or orchestrator | Definition of Ready holds |
| ready → in-progress | orchestrator at delegation (implementer in a worktree) | WIP below `wip_in_progress`; all `depends_on` done |
| in-progress → review | implementer | every AC checked with evidence; checks green |
| review → done | **orchestrator only** | a review file for this task with `verdict: approved` |
| review → in-progress | orchestrator | latest review is `changes-requested` |
| open → blocked | anyone | a Notes line `Blocked by: <question or T###>` |

The linter enforces legal transitions, "done requires an approved review" and "acceptance
criteria never shrink". Intermediate statuses usually stay uncommitted: the task commit
moves the file from `ready` to `done`. Epics move to `done` when all tasks are done, the
epic DoD is checked, and the closing retro exists.

## Definition of Ready (backlog → ready)

- Goal: one paragraph stating the outcome and why.
- Context: 2-5 paths to read first, plus an `Out of scope:` line.
- Acceptance Criteria: 1 to `acceptance_criteria_max` items, each checkable by a command,
  a test name or an observable result (writing rules: `plan-epic` skill).
- `model`, `size` (S or M), `priority` set; every `depends_on` id exists.
- Fits the budgets: within `task_diff_lines` and `task_files_changed` estimates,
  subtasks within `subtasks_per_task`. Bigger means split.

## Definition of Done (review → done)

1. Every AC checked, each with an evidence line in the Log.
2. The check sequence from `CLAUDE.md` exits 0 (re-run by the orchestrator).
3. No generated file hand-edited; no budget breach without a justified override.
4. Docs describing changed behaviour updated (`related_code` drift warnings clean).
5. New `TODO`/`FIXME` reference a task: `TODO(T012): ...`.
6. Latest review `approved`.
7. One commit `T###: <title>` containing code, tests, docs, task file and review files.

## Task file conventions

- **Acceptance Criteria** are frozen once work starts (`in-progress`, lint `ac_decrease`):
  check boxes only, never delete or weaken. Wrong AC: the orchestrator sets the task `blocked` with
  `Superseded by T###` in Notes and has the planner write a replacement task.
- **Subtasks**: the implementer may add or reword them; they are its working checklist.
- **Notes**: free text for context and decisions; one dated line each.
- **Log**: append-only, one dated line per event, newest last:

```
- 2026-10-02: started attempt 1 (sonnet)
- 2026-10-02: AC1 verified: npx vitest run context-meter (14 passed)
- 2026-10-02: review requested
- 2026-10-02: R004 changes-requested (1 blocker)
- 2026-10-02: started attempt 2 (opus)
- 2026-10-03: done (R005)
```

Retros count attempts, review rounds and escalations from these lines, so keep the verbs.

## Commits

| Change | Subject | Author |
|---|---|---|
| Task | `T###: <task title>` | orchestrator, after approval |
| Planning (new epic/tasks) | `E###: plan <epic title>` | orchestrator |
| Retro and its harness edits | `RT###: <retro title>` | orchestrator |
| Mechanical doc gardening | `docs: garden <scope>` | orchestrator |

Subjects ≤ 72 chars, imperative, English. Subagents never commit. Never commit with red
checks, never `--no-verify`, never amend a pushed commit.

## Review verdicts

The reviewer writes `forge/reviews/E###/R###-T###.md` (procedure: `forge-review` skill).

- **approved**: no blocker or major. The orchestrator records done and commits. Minor
  and nit findings never trigger a round; worthwhile ones become backlog tasks.
- **changes-requested**: at least one blocker or major. Move to `in-progress` and take
  the next ladder step with the review file as input.
- Disagree with a finding? Do not overrule it silently. Spawn a fresh reviewer with your
  counter-argument in the prompt; its verdict stands.
- From round 2 on, the reviewer checks prior findings first and raises new ones only on
  changed lines or unmet AC (no moving goalposts).

## Retry and escalation ladder

Every new implementer run counts as an attempt (`task_attempts`); every
changes-requested verdict counts as a round (`review_rounds`).

| Situation | Step 1 | Step 2 | Step 3 |
|---|---|---|---|
| Checks red after handback | Resume the same agent once with the failing output | Fresh run, next model | Re-plan |
| changes-requested on Sonnet | Fresh run on **Opus** with the review file | Re-plan | Blocked |
| changes-requested on Opus | Re-plan: planner splits or rewrites the task | Blocked | |
| Agent stops with questions | Answer in the task Notes, fresh run | Re-plan | |
| Partial report (`maxTurns` hit) | Log `maxTurns hit, resumed`; resume once if progress is visible | Split the task | |
| Tool or network flake | Retry once | Blocked with the error | |

Re-plan means the planner (Opus) splits the task or rewrites Context; the old task gets
`Superseded by T###`. **Blocked** at the end of the ladder is not a user question: write
the failure analysis in Notes, take other work, and let the next retro decide. Ask the
user only if the blocker is a destructive or outward action.

## HANDOFF.md

`forge/HANDOFF.md` (type `doc`) is the orchestrator's state across sessions, overwritten,
≤ 40 lines: **In flight** (task, agent, worktree path, step) · **Decisions pending** ·
**Next** (the next 3 picks) · **Last retro** (id, done tasks since) · **Last
gardening** (commit sha). History lives in git and task Logs, not here.
