---
id: T100
epic: E006
title: Combat view components on createPlayback
summary: "First half of the split T059: combat view components move to src/ui/combat on createPlayback; rafClock fix; test fights built via combatInput; clock tone."
keywords: ["task", "combat", "view", "components", "createplayback"]
type: task
status: done
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

- [x] `rafClock` stops when stop() is called inside a frame callback (stubbed-rAF test)
- [x] Combat view components render from `createPlayback` + view fold; no src/ui/sandbox adapter/player/log modules remain
- [x] UI reference-fight tests build inputs through `combatInput` (src/ui/combat/testing/fights.ts)
- [x] The clock shows mm:ss.mmm and its tone is amber from 10 s before deadlineMs and red after it (unit test)
- [x] `npm run check` and `npm run build` are green

## Subtasks

- [x] rafClock fix + test
- [x] fights.ts helper and test migration
- [x] clockTone test
- [x] Get the tree compiling and green

## Notes

- Orchestrator 2026-10-01 (R048 F1): deletions of dead sandbox modules (required by AC2) do not count toward task_diff_lines; new production code ~320 lines. Retro to codify "deleting dead code is free".

- Left for T101: the sandbox keeps its JSX-text exemption and English labels; combat.css still holds the unused sandbox log/statusbar styles; the shell status bar shows `skipx` at skip speed; ui.md "Dev sandbox route" still describes the T098 page.
- Strings live in the new area src/content/strings/en-combat.ts (areas.gen.ts regenerated), approved by the orchestrator.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus) - continues T059 worktree
- 2026-10-01: AC1 verified: npx vitest run src/ui/combat/playback.test.ts, 'rafClock' suite (stubbed rAF; stop() inside the callback leaves 0 pending frames)
- 2026-10-01: AC2 verified: Arena/ToolRow/Transport/ResultStrip in src/ui/combat/view take a Replay {fight, pb from createPlayback}; src/ui/sandbox holds only sandbox.tsx (adapter, player, log-text, names, combat-log deleted); npm run e2e 3 passed
- 2026-10-01: AC3 verified: fold, playback and timeline tests import fightInput from src/ui/combat/testing/fights.ts (newRun -> pickPrompt -> combatInput)
- 2026-10-01: AC4 verified: timeline.test.ts 'Deadline clock' (formatClock mm:ss.mmm; clockTone warn at deadline-10000 and at deadline, over at deadline+1)
- 2026-10-01: AC5 verified: npm run check exit 0 (475 tests, harness 0 errors), npm run build exit 0
- 2026-10-01: production diff (git diff --cached --numstat -M, without tests and Markdown): 482 added, 894 deleted (sandbox); tool-row.tsx and transport.tsx moves are not rename-detected
- 2026-10-01: review requested
- 2026-10-01: index.html links /src/ui/theme/combat.css (was the renamed sandbox.css); npm run build exit 0, dist/assets/index-CmRpVwMp.css (13.89 kB) contains the combat styles (.result__title)
- 2026-10-01: done (R048)
