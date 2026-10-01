---
id: T100
epic: E006
title: Combat view components on createPlayback
summary: "First half of the split T059: combat view components move to src/ui/combat on createPlayback; rafClock fix; test fights built via combatInput; clock tone."
keywords: ["task", "combat", "view", "components", "createplayback"]
type: task
status: in-progress
priority: p1
model: opus
size: M
updated: 2026-10-01
related: ["EPIC.md"]
depends_on: [T058, T056]
---

# T100: Combat view components on createPlayback

## Goal

Finish the in-flight T059 work as its first half: the combat view components (arena, tool row, transport, bits, art) live in src/ui/combat/view and run on `createPlayback`; the sandbox adapter/player are gone; `rafClock` stops when stop() is called inside a frame (R045 F1); UI test fights are built via `combatInput` (src/run/combat.ts).

## Context

- Epic: [E006](EPIC.md)
- Split of T059 (cancelled): its Notes hold the full plan and orchestrator items
- docs/game/ux/screens.md, docs/architecture/ui.md, src/ui/combat/**, src/run/combat.ts

## Acceptance Criteria

- [ ] `rafClock` stops when stop() is called inside a frame callback (stubbed-rAF test)
- [ ] Combat view components render from `createPlayback` + view fold; no src/ui/sandbox adapter/player/log modules remain
- [ ] UI reference-fight tests build inputs through `combatInput` (src/ui/combat/testing/fights.ts)
- [ ] The clock shows mm:ss.mmm and its tone is amber from 10 s before deadlineMs and red after it (unit test)
- [ ] `npm run check` and `npm run build` are green

## Subtasks

- [ ] rafClock fix + test
- [ ] fights.ts helper and test migration
- [ ] clockTone test
- [ ] Get the tree compiling and green

## Notes

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus) - continues T059 worktree
