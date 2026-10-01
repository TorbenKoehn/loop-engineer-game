---
title: Orchestrator handoff
summary: Live orchestrator state - work in flight, pending follow-ups and session caveats not visible on BOARD.md.
keywords: [handoff, orchestrator, state, follow-ups]
type: doc
status: active
updated: 2026-10-01
---

# Orchestrator handoff

## Goal

User goal (2026-10-01): finish the complete game in AA quality (M1 → M2 → M3, see
`docs/game/milestones.md`). Full autonomy. User loves red: red is the brand colour.

## In flight

- T020 (statuses, worktree), T015 (events/lessons, worktree), T096 (Biome ban, main tree).
- Done so far: 20 tasks (see BOARD.md). WIP limit 3 in-progress is hard: count main-tree tasks too.

## Retro 2 candidates (collect evidence)

- en.ts gets one import + spread per content area; parallel content tasks conflict every time.
  Consider one barrel file generated or one strings module per area loaded via a list.
- Never send a worktree agent to edit the main tree (permission classifier blocks it);
  rework happens in the worktree, then reset main and re-apply.
- Reviewers flag generated BOARD.md as "unstaged"; tell them it is orchestrator bookkeeping.

## Decisions (2026-10-01)

- Plan is complete for M1 (T007–T085); M2/M3 epics E012–E022 get tasks just in time.
- `backlog_items` warning accepted while M1 backlog is large; not raising the budget.
- event-log.md wins on event names; harness.config.json wins on coverage numbers.
- M1 exit criterion "moderated playtest" cannot be run by agents: replace with an
  automated comprehension proxy + ask the user for a human playtest at M1 end.

## Pending follow-ups (scaffold as harness tasks once T002 is done)

- Harness: forge/epics has 22 subdirs (> dir_subdirs); group epics by milestone.
- Harness: review scaffolder produces titles > `fm_title_chars` (R001 finding).
- Harness: `codeGlobs` miss `.tsx` files, so UI code escapes code budgets.
- Tooling: single tsconfig uses bundler resolution; tools/ lost nodenext checking
  (R001 F1). Split app/tools tsconfigs with references.
- Tooling: add `exactOptionalPropertyTypes` (R001 F2).

## Session caveats

- Custom agents in `.claude/agents/` were created mid-session and are not registered
  until the next session. Until then run them as `general-purpose` agents that first read
  their role file and skill. The SubagentStop lint hook does not fire for those.
