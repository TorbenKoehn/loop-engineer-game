---
id: T061
epic: E006
title: Combat log with why lines and seeking
summary: "Terminal-panel combat log: one t()-rendered line per event in the fixed format with why modifiers, filters, virtualisation to 200 rows, and click-to-seek with highlights."
keywords: ["combat-log", "ui", "why", "seeking", "virtualisation"]
type: task
status: in-progress
priority: p1
model: opus
size: M
depends_on: [T101, T010]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T061: Combat log with why lines and seeking

## Goal

The log is the show: every number in the fight can be traced to its cause, which is pillar one of the design.

## Context

- Epic: [E006](EPIC.md)
- [Screens: Tooltips and the combat log](../../../../docs/game/ux/screens.md#tooltips-and-the-combat-log)
- [Event log: kinds and why ids](../../../../docs/architecture/event-log.md#event-kinds)
- [UI: Combat replay player (seeking)](../../../../docs/architecture/ui.md#combat-replay-player)
- Code: `src/ui/combat/log/`
- Out of scope: Run-end summary (E009), screen-reader summaries (E020).

## Acceptance Criteria

- [ ] Each event renders as `[mm:ss.mmm] source -> target: verb value (why)`, e.g. `[00:12.350] grep v2 -> Context Drift: 14 dmg (Focused +20%, piped +30%)` (unit test)
- [ ] Filters All, Damage, Context and Enemies work
- [ ] A 600-event fight renders at most 200 log rows in the DOM
- [ ] Clicking a line seeks to it, pauses and highlights the involved units

## Subtasks

- [ ] Line formatter
- [ ] Filters
- [ ] Virtual list
- [ ] Seek and highlight

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
- 2026-10-01: maxTurns hit (90), resumed
