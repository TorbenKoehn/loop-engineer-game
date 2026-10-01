---
id: T058
epic: E006
title: Combat replay player and view fold
summary: "Playback with an injectable clock, cursor, speeds 1x/2x/4x/skip and pause, a pure foldEvent view, 100-event checkpoints for seeking, and hit-stop holds."
keywords: ["replay", "playback", "clock", "view-fold", "seeking", "ui"]
type: task
status: backlog
priority: p1
model: opus
size: M
depends_on: [T055, T018]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T058: Combat replay player and view fold

## Goal

The UI never computes rules: it plays the recorded event log, so what the player sees always matches the sim.

## Context

- Epic: [E006](EPIC.md)
- [UI: Combat replay player](../../../../docs/architecture/ui.md#combat-replay-player)
- [Event log: kinds, Ordering](../../../../docs/architecture/event-log.md)
- [Overview: Data flow](../../../../docs/architecture/overview.md#data-flow)
- Code: `src/ui/combat/playback.ts`, `src/ui/combat/fold.ts`
- Out of scope: Rendering (next tasks), fx and audio subscribers (E011).

## Acceptance Criteria

- [ ] With a manual clock, each frame advances simT by frameMs x speed and applies every event with t ≤ simT (tests at 1x, 2x, 4x)
- [ ] skip folds to the end without emitting bus events (test)
- [ ] After a full fold the view equals the fightEnd state (Trust, Severities) of a reference fight
- [ ] Seeking restores the nearest checkpoint and folds forward to the same view as a straight fold (property over random indices)
- [ ] paused stops advancing; a hit-stop request holds 60 ms except at skip

## Subtasks

- [ ] Clock interface
- [ ] foldEvent
- [ ] Checkpoints and seek
- [ ] Speed and pause

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
