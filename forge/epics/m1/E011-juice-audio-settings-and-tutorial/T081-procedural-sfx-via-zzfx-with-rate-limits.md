---
id: T081
epic: E011
title: "SFX presets, event mapping and rate limits"
summary: "zzfx parameter presets for every slice sound in content data, a pure event-kind to sound mapper with per-second limits, tag pitches and pipe pitch chains; no Web Audio yet."
keywords: ["audio", "sfx", "zzfx", "rate-limit", "pitch", "content"]
type: task
status: backlog
priority: p2
model: sonnet
size: S
depends_on: [T058]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T081: SFX presets, event mapping and rate limits

## Goal

Every important combat event has a distinct sound that never floods the mix. This task
writes the pure part: presets as content data and a mapper that decides which sound plays
at which pitch. Playing them through Web Audio follows in T115.

## Context

- Epic: [E011](EPIC.md); [Juice and audio: Audio](../../../../docs/game/ux/juice-audio.md#audio) (the sound table)
- [UI: Fx and audio bus](../../../../docs/architecture/ui.md#fx-and-audio-bus)
- New files: presets in `src/content/audio/sounds.ts`, mapper in `src/audio/`
- Out of scope: Web Audio, zzfx dependency, buses and lifecycle (T115); music, ducking, visualise sounds (E019).

## Acceptance Criteria

- [ ] Unit test passes: every sound in the juice-audio.md Audio table has a zzfx preset in `src/content/audio/sounds.ts` and is mapped from its event kind
- [ ] Unit test passes: 100 damage events within 1 s produce at most 8 `hit` sounds, and every sound respects its max per second
- [ ] Unit test passes: pipe chains raise pitch one semitone per step and reset after 1 s
- [ ] Unit test passes: `tool_fire` pitch follows the tool tag (Search high, Edit mid, Test bell, Shell low, Web chirp, Agent pad)

## Subtasks

- [ ] Presets
- [ ] Mapper and limiter
- [ ] Pitch rules

## Notes

- 2026-10-01 (RT005 re-size): narrowed to pure presets and mapping (~150 production lines); zzfx dependency, buses and lifecycle moved to T115.
- 2026-10-01: Meets the Definition of Ready; all depends_on done. Held in backlog because of wip_ready (8).

## Log

- 2026-10-01: created
