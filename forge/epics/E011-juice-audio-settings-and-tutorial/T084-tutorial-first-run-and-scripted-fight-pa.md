---
id: T084
epic: E011
title: Tutorial first run and scripted fight pauses
summary: "First-run flow with intro card and recommended harness, the tutorial row, and six scripted playback pauses on log events with fallbacks, Continue and Skip tutorial."
keywords: ["tutorial", "onboarding", "first-run", "pauses", "context-bar"]
type: task
status: backlog
priority: p1
model: opus
size: M
depends_on: [T064, T060, T082]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T084: Tutorial first run and scripted fight pauses

## Goal

A new player understands tools, the context bar and compaction after one fight, which M1 exit criterion 3 tests with people.

## Context

- Epic: [E011](EPIC.md)
- [Onboarding: First-run flow, Tutorial fight](../../../docs/game/ux/onboarding.md#tutorial-fight-scripted-pauses-same-sim)
- [UI: Combat replay player (pause)](../../../docs/architecture/ui.md#combat-replay-player)
- Code: `src/ui/tutorial/`
- Out of scope: First-time tips and progressive disclosure beyond the formula toggle (E020), playtest sessions.

## Acceptance Criteria

- [ ] On the first run the intro card shows, IDE Companion is recommended and row 1 is the single p1e1 tutorial node
- [ ] Playback pauses at the six triggers in onboarding.md, with fallbacks for pauses 4 and 5, each offering Continue (Enter) and Skip tutorial
- [ ] The tutorial fight's combat log equals the same fight without the tutorial (test)
- [ ] Tutorial state persists in the meta save and can be reset from Settings

## Subtasks

- [ ] First-run detection
- [ ] Pause triggers
- [ ] Highlight overlay
- [ ] Reset

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
