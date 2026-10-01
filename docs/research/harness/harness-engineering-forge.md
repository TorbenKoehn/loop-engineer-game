---
title: Harness engineering - forge task tracking
summary: Design for the in-repo forge - epic/task/review units, status transitions with checkable preconditions, task and review templates, acceptance criteria rules and DoD.
keywords: [forge, kanban, tasks, status-flow, acceptance-criteria, definition-of-done, review]
type: research
status: active
updated: 2026-10-01
related: [harness-engineering.md, ../budgets/budgets-forge.md, orchestration-patterns.md]
---

# Forge: in-repo task tracking for agents

Part of [harness-engineering.md](harness-engineering.md). Limits (WIP,
tasks per epic, AC count, review rounds) are in
[budgets-forge.md](../budgets/budgets-forge.md) and `harness.config.json`. Field names
below match the current `harness.config.json` types.

## Contents
- Why Markdown in the repo
- Units of work
- Status flow and transition rules
- Templates (task, review)
- Acceptance criteria and Definition of Done
- Protecting the forge from agents
- Sources

## Why Markdown in the repo

Tools like Backlog.md (one Markdown file per task, AC checkboxes, DoD,
statuses) and beads (git-backed issue graph, `bd ready --json` returns
unblocked work) show the pattern works: the agent's memory of "what's next"
must survive `/clear` and live in git. We build our own because it reuses the
docs frontmatter, INDEX and linter with zero extra dependencies.

The known risk: Anthropic found models "less likely to inappropriately change
or overwrite JSON files compared to Markdown files" and told agents "it is
unacceptable to remove or edit tests". We keep Markdown but take away the
dangerous edits with mechanics (see last section).

## Units of work

| Unit | Definition | Lives in |
|---|---|---|
| Epic | One player-visible outcome, e.g. "first playable loop". Has goal, scope, out-of-scope, exit criteria | `forge/epics/E001-slug/EPIC.md` |
| Task | One delegation = one subagent run = one commit = one review. Size S or M only; L means split | `forge/epics/E001-slug/T001-slug.md` |
| Subtask | A checklist item inside a task. If it needs its own subagent, promote it to a task | task body |
| Review | Independent verdict on one task attempt | `forge/reviews/R001-T001.md` |
| Retro | Lessons + max 3 harness actions | `forge/retros/RT001-slug.md` |
| Bug | A task with `labels: [bug]` and a reproduction as its first AC | epic folder |

IDs come only from `npm run harness:new` (never hand-picked): parallel
agents would otherwise collide on `T004`.

## Status flow and transition rules

```
backlog ──> ready ──> in-progress ──> review ──> done
                ^          |  ^          |
                |          v  └──────────┘ changes-requested
                └──── blocked (from any open state, returns to prior state)
```

| Transition | Who | Preconditions (all lintable) |
|---|---|---|
| backlog → ready | orchestrator (planner drafts) | 1-5 AC items; `model`, `size`, `priority` set; every `depends_on` exists |
| ready → in-progress | orchestrator, at delegation | WIP below `wip_in_progress`; all `depends_on` are `done`; sets `started`, `assignee`, `attempts += 1` |
| in-progress → review | implementer | all subtasks checked; "Evidence" section lists commands run with results; commit sha recorded |
| review → done | orchestrator | a review file for this task with `verdict: approved` exists and is newer than the last commit |
| review → in-progress | orchestrator | review `verdict: changes-requested`; `review_rounds += 1` |
| * → blocked | anyone | `blocked_since` set; "Blocked by" line names the question or task |
| epic → done | orchestrator | all tasks done; exit criteria checked; retro file exists |

Only the orchestrator moves anything to `done`. Implementers can reach
`review` at most; reviewers only write review files. This mirrors the
evaluator-optimizer split and keeps "marked done without testing", the top
failure in Anthropic's long-running harness, structurally impossible.

## Templates

Task (frontmatter = `harness.config.json` task type + process counters):

```markdown
---
title: Context meter drains per action
summary: Each agent action spends context points; at 0 the run ends. Implements the mana-like context mechanic.
keywords: [context, meter, combat, sim]
type: task
status: ready
updated: 2026-10-01
id: T004
epic: E001
priority: p1
model: sonnet
size: S
depends_on: [T002]
related: [../../../docs/design/context-mechanic.md]
---
## Goal
One paragraph: what changes for the player and why.

## Context
Paths to read first (no pasted content): src/sim/turn.ts, docs/design/context-mechanic.md

## Acceptance criteria
- [ ] `npm test -- context-meter` passes, covering drain, floor at 0, run end
- [ ] A run with 0 context ends with outcome `context-exhausted`

## Subtasks
- [ ] Add `ContextMeter` to sim state
- [ ] Wire drain into action resolution

## Out of scope
UI for the meter (T006).

## Evidence
(filled by implementer: commands run, exit codes, commit sha)

## Notes
(append-only, dated, one line each)
```

Review:

```markdown
---
(base fields) type: review, id: R007, task: T004, verdict: changes-requested
---
## Findings
| Sev | Where | Finding | Required fix |
|---|---|---|---|
| blocker | src/sim/turn.ts:41 | drain applied twice on combo actions | apply once in resolveAction |
## AC check
- [x] AC1 verified by: npm test -- context-meter (14 passed)
- [ ] AC2 not verified: no test for run end
```

Severities: `blocker` (wrong behaviour, AC unmet, data loss), `major`
(missing test for an AC, budget breach), `minor`, `nit`. Only blocker/major
produce `changes-requested`; minor/nit go to the notes and never trigger a
round, otherwise reviewers drive over-engineering (Claude Code best practices
warn exactly about this).

## Acceptance criteria and Definition of Done

AC rules:
- Observable and checkable by a command, a test name, or a screenshot. "Works
  well" is not an AC.
- Describe outcomes, not implementation. Implementation hints go to Context.
- 1-5 items. Six or more means the task is an epic in disguise.
- For game features add one behavioural AC that a playtest/QA agent can
  check in the browser (Playwright), not just unit tests.

Global Definition of Done (one file, `docs/harness/definition-of-done.md`,
referenced from every task via the forge rule, never copied into tasks):
1. All AC checked, each with evidence.
2. `npm run harness:check`, `npx tsc --noEmit`, `npm test` exit 0.
3. Diff within `task_diff_lines`; no generated file hand-edited.
4. Docs touched by the change updated (`related_code` drift check clean).
5. One commit, subject ≤ 72 chars, referencing the task id.
6. Review `approved`.

## Protecting the forge from agents

- PreToolUse guard: deny `Write|Edit` on `forge/BOARD.md` and `**/INDEX.md`.
- Linter rule `ac_shrunk`: once a task left `backlog`, its AC item count may
  not drop versus `git show HEAD:<file>` unless the Notes section has a
  dated line starting `AC changed:` written by the orchestrator. That is the
  Markdown equivalent of "it is unacceptable to remove or edit tests".
- Linter rule `illegal_transition`: compare `status` with HEAD and reject
  transitions not in the table (e.g. in-progress → done).
- Linter rule `done_without_review`: `done` requires an approved review file.
- Status changes go through `npm run harness:new` / a `harness:move T004 review`
  command, so preconditions are checked at the moment of change, not later.

## Orchestrator cycle on the forge

1. Read `forge/HANDOFF.md`, `forge/BOARD.md`, `git log --oneline -10`.
2. Review queue first (WIP), then blocked items, then pull the top `ready`
   task by priority whose dependencies are done.
3. Delegate (template in [orchestration-patterns.md](orchestration-patterns.md)).
4. On return: run checks yourself (do not trust the report), spawn reviewer.
5. Move status, update HANDOFF.md, commit.

## Sources
- https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
- https://code.claude.com/docs/en/best-practices (adversarial review, over-engineering warning)
- https://github.com/MrLesk/Backlog.md
- https://github.com/steveyegge/beads (via https://ianbull.com/posts/beads/)
- https://www.anthropic.com/engineering/building-effective-agents (evaluator-optimizer)
