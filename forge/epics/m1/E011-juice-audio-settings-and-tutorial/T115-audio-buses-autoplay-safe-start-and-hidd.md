---
id: T115
epic: E011
title: Audio buses, autoplay-safe start and hidden mute
summary: "zzfx playback of the T081 sounds from the fx bus through master and SFX gain buses, starting only after the first user input and muting while the tab is hidden."
keywords: ["audio", "zzfx", "web-audio", "buses", "autoplay", "mute"]
type: task
status: backlog
priority: p2
model: sonnet
size: S
depends_on: [T081, T079]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T115: Audio buses, autoplay-safe start and hidden mute

## Goal

Combat sounds play in the browser, and audio never surprises the player: nothing plays
before the first input, and a hidden tab is silent.

## Context

- Epic: [E011](EPIC.md); [Juice and audio: Mixing](../../../../docs/game/ux/juice-audio.md#mixing)
- [UI: Fx and audio bus](../../../../docs/architecture/ui.md#fx-and-audio-bus)
- `src/audio/` (T081's mapper), the bus from T079, `package.json`
- Out of scope: music and UI buses, ducking (E019); the settings UI (T116).

## Acceptance Criteria

- [ ] `zzfx` is a runtime dependency and `npm run harness:lint` shows no `deps_runtime` error
- [ ] Unit test with a stub audio context passes: sounds from the fx bus play through an SFX gain into a master gain, and the volumes (defaults 80 / 80%) set those gains
- [ ] Unit test passes: no sound plays before the first pointer or key input
- [ ] Unit test passes: sounds are muted while `document.visibilityState` is hidden and resume when visible

## Subtasks

- [ ] zzfx and buses
- [ ] Fx bus subscription
- [ ] Lifecycle

## Notes

- 2026-10-01: zzfx becomes a runtime dependency (deps_runtime budget 5). Carried over from T081.
- 2026-10-01: Split from T081 (RT005 re-size), ~100 production lines. Meets the Definition of Ready; promote when T081 and T079 are done.

## Log

- 2026-10-01: created
