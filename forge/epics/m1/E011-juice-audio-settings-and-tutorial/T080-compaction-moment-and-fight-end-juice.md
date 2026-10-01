---
id: T080
epic: E011
title: Compaction moment and typed text
summary: "The dimmed \"Compacting conversation…\" moment typed at 60 chars/s with the bar drain and hold, a typed-text component for event text, and no shake during the moment."
keywords: ["juice", "compaction", "typed-text", "reduced-motion", "context-bar"]
type: task
status: backlog
priority: p2
model: opus
size: M
depends_on: [T079, T060]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T080: Compaction moment and typed text

## Goal

Compaction, the key context event, gets an unmistakable moment. The typed-text component it
needs is reused for event text and the defeat cut (T114).

## Context

- Epic: [E011](EPIC.md); [Juice and audio: Compaction moment, Typed text](../../../../docs/game/ux/juice-audio.md#juice-catalogue)
- [Context: Auto-compaction (UI moment)](../../../../docs/game/systems/context.md#auto-compaction-overflow)
- `src/render-fx/` and the bus from T079, `src/ui/combat/playback.ts`, `src/ui/combat/view/context-bar.tsx`
- Out of scope: victory, defeat, strike-through and Deadline effects (T114); typing log lines; boss layer breaks (E019).

## Acceptance Criteria

- [ ] UI test passes: a `compaction` event dims the screen 70% and types "Compacting conversation…" at 60 chars/s while the bar drains over 600 ms
- [ ] Playback test passes: at 1x the moment holds playback 1000 ms for auto and 500 ms for planned compaction
- [ ] Test passes: shake never runs during the compaction moment, and with reducedMotion only the text shows, without drain animation
- [ ] UI test passes: the typed-text component types event text on the Standup screen at 120 chars/s, any key completes it, and with reducedMotion it is instant

## Subtasks

- [ ] Typed-text component
- [ ] Compaction overlay and hold
- [ ] Shake guard and reduced variant

## Notes

- 2026-10-01 (RT005 re-size): narrowed to the compaction moment and typed text (~200 production lines); fight-end effects moved to T114.
- 2026-10-01: Meets the Definition of Ready; promote when all depends_on are done.

## Log

- 2026-10-01: created
