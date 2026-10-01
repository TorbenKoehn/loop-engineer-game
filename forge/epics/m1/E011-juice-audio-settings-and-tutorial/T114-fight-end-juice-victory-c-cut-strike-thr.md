---
id: T114
epic: E011
title: "Fight-end juice: victory, ^C cut, strike-through"
summary: "Victory status-bar sweep, defeat cut to black with typed red ^C, enemy strike-through and collapse, Deadline clock pulse and vignette, each with its reduced-motion variant."
keywords: ["juice", "victory", "defeat", "deadline", "strike-through", "reduced-motion"]
type: task
status: backlog
priority: p2
model: sonnet
size: S
depends_on: [T080]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T114: Fight-end juice: victory, ^C cut, strike-through

## Goal

Fight ends and resolved enemies read instantly, and the Deadline feels urgent, without any
effect hiding information from reduced-motion players.

## Context

- Epic: [E011](EPIC.md); [Juice and audio: Juice catalogue](../../../../docs/game/ux/juice-audio.md#juice-catalogue) (rows Enemy resolved, Deadline, Victory, Defeat)
- `src/render-fx/` and the bus from T079, the typed-text component from T080
- `src/ui/combat/view/arena.tsx`, `src/ui/shell/shell.tsx` (status bar)
- Out of scope: compaction moment (T080); audio (T115); boss layer breaks (E019).

## Acceptance Criteria

- [ ] UI test passes: `fightEnd` win sweeps the status bar cyan for 400 ms and shows "✓ resolved"
- [ ] UI test passes: `fightEnd` loss cuts the screen to black and types a red `^C`
- [ ] UI test passes: a `resolved` enemy card gets a line-through, then collapses over 300 ms
- [ ] UI test passes: each Deadline second pulses the clock red with an 8% red vignette
- [ ] Unit test passes: with reducedMotion victory and defeat are static, resolved enemies are removed at once with their log line, and the Deadline changes the clock colour only

## Subtasks

- [ ] Victory and defeat
- [ ] Strike-through
- [ ] Deadline pulse
- [ ] Reduced variants

## Notes

- 2026-10-01: Split from T080 (RT005 re-size), ~130 production lines plus CSS. Meets the Definition of Ready; promote when T080 is done.

## Log

- 2026-10-01: created
