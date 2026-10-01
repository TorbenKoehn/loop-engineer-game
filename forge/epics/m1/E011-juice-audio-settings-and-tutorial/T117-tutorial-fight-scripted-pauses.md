---
id: T117
epic: E011
title: Tutorial fight scripted pauses
summary: "Six scripted playback pauses on log events with highlights, fallbacks for pauses 4 and 5, Continue (Enter) and Skip tutorial, and a determinism test against the same fight without the tutorial."
keywords: ["tutorial", "onboarding", "pauses", "context-bar", "determinism"]
type: task
status: backlog
priority: p1
model: opus
size: M
depends_on: [T084, T060]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T117: Tutorial fight scripted pauses

## Goal

A new player understands tools, the context bar and compaction after one fight. The UI
pauses the normal replay at scripted events; the sim is untouched, so the tutorial stays
deterministic.

## Context

- Epic: [E011](EPIC.md); [Onboarding: Tutorial fight](../../../../docs/game/ux/onboarding.md#tutorial-fight-scripted-pauses-same-sim)
- [UI: Combat replay player (pause)](../../../../docs/architecture/ui.md#combat-replay-player)
- `src/ui/combat/playback.ts`, `src/ui/tutorial/` (T084)
- Out of scope: first-run flow (T084); first-time tips (E020); playtest sessions.

## Acceptance Criteria

- [ ] UI test with a fixture log passes: playback pauses at each of the six triggers in onboarding.md and highlights the named element with its text
- [ ] UI test passes: pause 4 falls back to `t = 8000` without `zoneChanged`, and pause 5 to fight end without `compaction`
- [ ] UI test passes: each pause offers Continue (Enter) and Skip tutorial, and Skip removes all remaining pauses
- [ ] Test passes: the tutorial fight's combat log equals the same fight without the tutorial
- [ ] Playwright passes: a first run's tutorial fight stops at pause 1 and Continue resumes playback

## Subtasks

- [ ] Trigger matcher over the event log
- [ ] Highlight overlay
- [ ] Continue and Skip
- [ ] Determinism test and e2e

## Notes

- 2026-10-01: Split from T084 (RT005 re-size), ~200 production lines. Meets the Definition of Ready; promote when T084 is done.

## Log

- 2026-10-01: created
