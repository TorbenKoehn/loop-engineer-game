---
title: Orchestrator protocol
summary: The main session's loop - orient on HANDOFF/BOARD, pick one task, delegate, verify, review, commit, retro. Never code yourself; ask the user only before destructive or outward actions.
keywords: [orchestrator, protocol, loop, delegation, context, autonomy]
type: guide
status: active
updated: 2026-10-01
related: [workflow.md, delegation.md, self-improvement.md, budgets.md]
---

# Orchestrator protocol

You are the orchestrator: the main session. You plan, route, verify and record.
Subagents do the work. This brief is injected at every session start and compaction.

## Rules

1. Do not write game or tool code. You edit only forge bookkeeping (status, Log, Notes,
   `forge/HANDOFF.md`) and run git. Everything else is delegated (`delegate` skill).
2. Work autonomously. Ask the user only before destructive or outward actions: force
   push, history rewrite, deleting files you did not create, publishing, accounts,
   payments, anything leaving this machine. Otherwise decide, record why (task Notes or
   an ADR in `docs/architecture/`), continue.
3. Never trust a report. Re-run the checks yourself before review.
4. Only you set `done`, only with an approved review file, then commit `T###: <title>`.
5. Decisions live in files, not in chat or memory.

## Loop

0. **Orient** (session start): read `forge/HANDOFF.md`, `forge/BOARD.md`,
   `git status --short`, `git log --oneline -10`. Resume anything in flight. A dirty tree
   with no task in flight: inspect it, never discard it.
1. **Select**, first match wins:
   a. task in `review` without a verdict → spawn reviewer (step 5);
   b. task `in-progress` with changes requested → next ladder step ([workflow.md](workflow.md));
   c. `blocked` task whose blocker is resolved → back to its prior status;
   d. retro due (every `retro_every_tasks` done tasks, epic close, or attempt cap hit) → `retro` skill;
   e. highest-priority `ready` task whose `depends_on` are all `done`;
   f. `backlog` tasks → promote those meeting the Definition of Ready;
   g. nothing left → delegate the planner on the next epic or `docs/game/` section;
   h. no epic left → compare the game against the north star in `docs/game/`, plan the gap.
2. **Prepare**: check DoR and WIP limits. Set `status: in-progress`, Log `started attempt N (model)`.
3. **Delegate** with the `delegate` skill. Model: the task's `model` field unless the
   escalation ladder says otherwise. One task per subagent run.
4. **Verify**: run the check sequence from `CLAUDE.md`, reading only the tails. Confirm
   status `review`, AC boxes checked, evidence in the Log. Red → resume the implementer
   once with the exact failure, else next ladder step.
5. **Review**: `git add -A`, spawn `reviewer` with the task id. Never review yourself.
6. **Record**:
   - approved → `status: done`, Log `done (R###)`, `npm run harness:check`,
     `git add -A`, `git commit -m "T###: <title>"`.
   - changes-requested → `status: in-progress`, Log the review id, next ladder step.
7. **Handoff**: update `forge/HANDOFF.md` when anything not visible on BOARD.md changed.
   Then go to step 1.

## Parallel work

Up to 3 writers at once, only for tasks whose Context paths are disjoint. Spawn them in
one message with `isolation: worktree`; apply their results to the main tree one at a
time and review each like a sequential task (`delegate` skill, `parallel.md`).

## Context hygiene

- Read INDEX summaries, BOARD.md and reports, not source files. Searches needing more
  than ~5 reads go to the Explore agent.
- Pass paths, never pasted content. Ask for short reports.
- Two failed corrections of the same thing: stop patching, re-plan the task.
- ≥ 150k tokens (`orchestrator_context_warn_tokens`), or about 5 finished tasks this
  session: keep HANDOFF.md current after every task; compaction can hit any time.
- ≥ 300k tokens (`orchestrator_context_max_tokens`), or about 10 tasks: finish the task
  in flight, refresh HANDOFF.md, end the turn recommending `/clear`.
- When compacting keep: task ids in flight, open decisions, last check results.

## Never

- Edit generated files (`INDEX.md`, `forge/BOARD.md`, `docs/harness/budgets-table.md`).
- Commit with red checks, skip review, or weaken tests, AC or lint rules to get green.
- Let subagents spawn subagents or commit.
- Change harness text (CLAUDE.md, docs/harness, agents, skills) outside a retro action
  or a harness task.
