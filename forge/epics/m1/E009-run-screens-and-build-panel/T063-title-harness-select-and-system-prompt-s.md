---
id: T063
epic: E009
title: Title, harness select and system prompt screens
summary: "Title with New run, harness select with the two M1 config cards (IDE Companion recommended on the first run), and the 3-card system prompt pick leading to the map."
keywords: ["ui", "title", "harness-select", "system-prompt", "screens"]
type: task
status: done
priority: p1
model: opus
size: M
depends_on: [T056, T040, T011]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T063: Title, harness select and system prompt screens

## Goal

A player can start a run from the title and make the first two decisions of the slice: harness and system prompt.

## Context

- Epic: [E009](EPIC.md)
- [Screens: Screen flow, Other screens](../../../../docs/game/ux/screens.md#screen-flow)
- [Harnesses: Harness select screen copy](../../../../docs/game/content/harnesses.md#harness-select-screen-copy)
- [Onboarding: First-run flow](../../../../docs/game/ux/onboarding.md#first-run-flow)
- Code: `src/ui/screens/title.tsx`, `src/ui/screens/harness-select.tsx`, `src/ui/screens/prompt-pick.tsx`
- Out of scope: Daily, History and Codex entries (M2), tutorial intro card (E011), Continue (E008).

## Acceptance Criteria

- [x] Playwright: Title → New run → harness select shows Terminal Purist and IDE Companion cards with config block, fantasy line, difficulty tag and trait
- [x] On the first run IDE Companion is preselected and tagged as recommended
- [x] Picking one of 3 prompt cards (weight, effect line, tip) dispatches pickPrompt and shows the map mode
- [x] Each screen sets initial focus and works by keyboard alone

## Subtasks

- [x] Title
- [x] Harness cards
- [x] Prompt cards
- [x] Focus handling

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.
- 2026-10-01: Difficulty tags live in strings (`harness.<id>.difficulty`) because content defs were out of scope; win counts wait for history in MetaView (E008/E015).
- budget_override task_diff_lines: 614 production lines (screens.css 273, tsx 314, strings 27); reason: player-facing screen polish, split would cost polish or be ceremony; orchestrator-approved 2026-10-01

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
- 2026-10-01: AC1 verified: tests/e2e/run-setup.spec.ts, both cards show config dl, fantasy, Difficulty tag, trait (passed)
- 2026-10-01: AC2 verified: run-setup.spec.ts (IDE Companion radio checked, focused, tagged; Purist untagged) and npx vitest run harness-select (2 passed)
- 2026-10-01: AC3 verified: run-setup.spec.ts, 3 prompt cards with quote, weight, effect line and tip; Enter dispatches pickPrompt, banner phase-1/map (passed)
- 2026-10-01: AC4 verified: run-setup.spec.ts keyboard-only path (initial focus, arrows, Enter, Esc) and the reduced-motion test; npm run check 0, npm run build 0, e2e 5 passed
- 2026-10-01: blocked on the diff budget (614 production lines)
- 2026-10-01: diff budget exception approved by the orchestrator (no split); review requested
- 2026-10-01: done (R057)
