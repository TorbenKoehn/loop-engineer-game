---
id: T113
epic: E011
title: Card and zone flashes, shake and hit-stop
summary: "Card flash on toolFired, zone flash on zoneChanged, shake on agent damage and a 60 ms hit-stop on big hits, each with its reduced-motion variant, plus the full effect-map test."
keywords: ["juice", "render-fx", "shake", "hit-stop", "flash", "reduced-motion"]
type: task
status: backlog
priority: p2
model: opus
size: S
depends_on: [T079]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T113: Card and zone flashes, shake and hit-stop

## Goal

Hits and tool fires read at a glance, and every effect has a reduced-motion variant. Hit-stop
holds playback, so it touches the replay player and is routed to Opus.

## Context

- Epic: [E011](EPIC.md); [Juice and audio: Juice catalogue](../../../../docs/game/ux/juice-audio.md#juice-catalogue)
- [Accessibility: Motion and flashing](../../../../docs/game/ux/accessibility.md#motion-and-flashing)
- `src/render-fx/` and the bus from T079, `src/ui/combat/playback.ts`, `src/ui/shell/shell.tsx` (shake on the shell root)
- Out of scope: compaction moment and fight-end effects (T080, T114); particles and pipe sparks (E019).

## Acceptance Criteria

- [ ] UI test passes: `toolFired` flashes the tool card border for 120 ms and `zoneChanged` makes the bar glow in the new zone colour for 200 ms
- [ ] Unit test passes: damage to the agent shakes the shell root with amplitude `min(8, 1 + floor(dmg / 5))` px for 150 ms
- [ ] Playback test passes: a hit of at least 15% of the target's max holds playback 60 ms, never at skip or with reducedMotion
- [ ] Unit test over the whole event-to-effect map passes: with reducedMotion every effect uses its catalogue reduced variant (shake and hit-stop off, flashes kept, zone colour only, pops static)

## Subtasks

- [ ] Flashes
- [ ] Shake
- [ ] Hit-stop in playback
- [ ] Reduced-motion map test

## Notes

- 2026-10-01: Split from T079 (RT005 re-size), ~150 production lines. Meets the Definition of Ready; promote when T079 is done.

## Log

- 2026-10-01: created
