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

- T003 (RNG) and T006 (check script): implementers running in parallel in the main tree.
- Planner: planning M1 epics/tasks (E002+) and M2/M3 backlog epics.

## Pending follow-ups (scaffold as tasks once the planner is done)

- Harness: review scaffolder produces titles > `fm_title_chars` (R001 finding).
- Harness: `codeGlobs` miss `.tsx` files, so UI code escapes code budgets.
- Tooling: single tsconfig uses bundler resolution; tools/ lost nodenext checking
  (R001 F1). Split app/tools tsconfigs with references.
- Tooling: add `exactOptionalPropertyTypes` (R001 F2).

## Session caveats

- Custom agents in `.claude/agents/` were created mid-session and are not registered
  until the next session. Until then run them as `general-purpose` agents that first read
  their role file and skill. The SubagentStop lint hook does not fire for those.
