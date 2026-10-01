---
id: T079
epic: E011
title: "Fx bus and combat juice: pops, flashes, shake"
summary: "Typed playback event bus, Canvas2D overlay with pooled number pops, card and zone flashes, CSS shake and hit-stop, each with its reduced-motion variant and off at skip."
keywords: ["juice", "render-fx", "canvas", "reduced-motion", "number-pops"]
type: task
status: backlog
priority: p2
model: opus
size: M
depends_on: [T101]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T079: Fx bus and combat juice: pops, flashes, shake

## Goal

Fights feel responsive without ever changing the sim, and every effect respects reduced motion.

## Context

- Epic: [E011](EPIC.md)
- [Juice and audio: Juice catalogue, Readability guards](../../../../docs/game/ux/juice-audio.md#juice-catalogue)
- [UI: Fx and audio bus](../../../../docs/architecture/ui.md#fx-and-audio-bus)
- [Accessibility: Motion and flashing](../../../../docs/game/ux/accessibility.md#motion-and-flashing)
- Code: `src/render-fx/`, `src/ui/combat/bus.ts`
- Out of scope: Compaction moment and fight-end effects (next task), particles (E019).

## Acceptance Criteria

- [ ] Playback emits applied events on a typed bus; render-fx subscribes without importing the store (arch test passes)
- [ ] Number pops (pooled, at most 6 at once, extras merged to +N), card flash on toolFired, zone flash on zoneChanged and shake on agent damage follow the catalogue specs
- [ ] Hit-stop requests a 60 ms hold for hits ≥ 15% of the target's max, never at skip or in reduced motion
- [ ] With reducedMotion every effect uses its reduced variant (unit test over the event-to-effect map)

## Subtasks

- [ ] Bus
- [ ] Overlay and pools
- [ ] Effects
- [ ] Reduced-motion map

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
