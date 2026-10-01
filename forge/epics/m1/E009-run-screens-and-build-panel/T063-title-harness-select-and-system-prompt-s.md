---
id: T063
epic: E009
title: Title, harness select and system prompt screens
summary: "Title with New run, harness select with the two M1 config cards (IDE Companion recommended on the first run), and the 3-card system prompt pick leading to the map."
keywords: ["ui", "title", "harness-select", "system-prompt", "screens"]
type: task
status: in-progress
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

- [ ] Playwright: Title → New run → harness select shows Terminal Purist and IDE Companion cards with config block, fantasy line, difficulty tag and trait
- [ ] On the first run IDE Companion is preselected and tagged as recommended
- [ ] Picking one of 3 prompt cards (weight, effect line, tip) dispatches pickPrompt and shows the map mode
- [ ] Each screen sets initial focus and works by keyboard alone

## Subtasks

- [ ] Title
- [ ] Harness cards
- [ ] Prompt cards
- [ ] Focus handling

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
