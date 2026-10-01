---
title: Orchestrator handoff
summary: Live orchestrator state - goal, decisions and caveats not visible on BOARD.md; in-flight work is on BOARD.md.
keywords: [handoff, orchestrator, state, decisions]
type: doc
status: active
updated: 2026-10-01
---

# Orchestrator handoff

## Goal

User goal (2026-10-01): finish the complete game in AA quality (M1 → M2 → M3, see
`docs/game/milestones.md`). Full autonomy. User loves red: red is the brand colour.
The user wants to see progress: `npm run dev` (title screen; `?sandbox` in dev builds).

## Working state

- In-flight tasks are the `in-progress` column of `forge/BOARD.md`; worktrees live in
  `.claude/worktrees/` (one stale, undeletable dir `agent-a2f9106e61f65d46f` may remain).
- Helpers used by the orchestrator (scratchpad, not in repo): apply a worktree diff with
  `git diff --cached HEAD` excluding generated files, then `git apply -3 --index`.
- After each batch: run doc-gardener for review findings that name docs.

## Decisions (2026-10-01)

- M2/M3 epics get tasks just in time; `backlog_items` warning accepted for M1.
- event-log.md wins on event names; harness.config.json wins on coverage numbers.
- M1 exit criterion "moderated playtest": automated comprehension proxy + ask the user
  for a human playtest at M1 end.
- Prime `count: n` primes n different tools (soonest first).
- Phase noise scale uses scale[phase] / scale[home], like Severity and damage.
- Deleted dead code does not count against task_diff_lines (RT003).
