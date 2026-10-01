---
id: T079
epic: E011
title: "Fx bus, canvas overlay and number pops"
summary: "Typed playback event bus, a Canvas2D render-fx overlay that subscribes without the store, and pooled number pops with merge counter and reduced-motion variant."
keywords: ["juice", "render-fx", "canvas", "fx-bus", "number-pops", "reduced-motion"]
type: task
status: backlog
priority: p2
model: opus
size: M
depends_on: [T101]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T079: Fx bus, canvas overlay and number pops

## Goal

Fights feel responsive without ever changing the sim. This task lays the path every later
effect and sound uses: playback emits applied events on a typed bus, and the render-fx
overlay draws number pops from it. Flashes, shake and hit-stop follow in T113, audio in T115.

## Context

- Epic: [E011](EPIC.md); [Juice and audio: Juice catalogue, Readability guards](../../../../docs/game/ux/juice-audio.md#juice-catalogue)
- [UI: Fx and audio bus](../../../../docs/architecture/ui.md#fx-and-audio-bus)
- `src/ui/combat/playback.ts`, `tests/arch.test.ts` (paths after T105)
- New files in `src/render-fx/` and the bus in `src/ui/combat/`
- Out of scope: flashes, shake, hit-stop (T113); compaction moment (T080); audio (T081, T115); particles (E019).

## Acceptance Criteria

- [ ] Unit test passes: playback emits each applied event once on a typed bus, also while seeking forward, and emits nothing at skip
- [ ] `tests/arch.test.ts` passes with a rule that `src/render-fx/` does not import the store or the sim state
- [ ] Unit test passes: number pops are pooled, at most 6 show at once, and extra values merge into a `+N` counter
- [ ] Unit test passes: pop parameters follow the catalogue (18 px rising 24 px over 600 ms, +4 px at 20% of target max, 28 px for a single hit of 30 or more)
- [ ] Unit test passes: with reducedMotion a pop is a static number for 600 ms

## Subtasks

- [ ] Typed bus and playback emit
- [ ] Overlay canvas and pool
- [ ] Pop effect and reduced variant

## Notes

- 2026-10-01 (RT005 re-size): narrowed to bus, overlay and pops (~220 production lines); flashes, shake and hit-stop moved to T113.
- 2026-10-01: Meets the Definition of Ready; all depends_on done. Held in backlog because of wip_ready (8).

## Log

- 2026-10-01: created
