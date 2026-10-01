---
id: T081
epic: E011
title: Procedural SFX via zzfx with rate limits
summary: "zzfx presets for every slice sound in content data, event-kind mapping with per-second limits and pitch chains, master and SFX buses, autoplay-safe start and mute when hidden."
keywords: ["audio", "sfx", "zzfx", "mixing", "rate-limit"]
type: task
status: backlog
priority: p2
model: opus
size: M
depends_on: [T058]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T081: Procedural SFX via zzfx with rate limits

## Goal

Every important combat event has a distinct, rate-limited sound, and audio never surprises the player.

## Context

- Epic: [E011](EPIC.md)
- [Juice and audio: Audio, Mixing, Audio accessibility](../../../../docs/game/ux/juice-audio.md#audio)
- [UI: Fx and audio bus](../../../../docs/architecture/ui.md#fx-and-audio-bus)
- Code: `src/audio/`, `src/content/sounds.ts`
- Out of scope: Music, music and UI buses, ducking, visualise sounds (E019).

## Acceptance Criteria

- [ ] Every sound in the juice-audio.md Audio table is a zzfx preset in src/content/sounds.ts mapped from its event kind
- [ ] Per-second limits hold: 100 damage events in 1 s produce at most 8 hit sounds (unit test)
- [ ] Pipe chains raise pitch one semitone per step and reset after 1 s (test)
- [ ] Audio starts only after the first user input and mutes when the tab is hidden
- [ ] Master and SFX volumes apply through buses

## Subtasks

- [ ] Presets
- [ ] Mapper and limiter
- [ ] Buses
- [ ] Lifecycle

## Notes

- 2026-10-01: zzfx becomes a runtime dependency (deps_runtime budget 5).
- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
