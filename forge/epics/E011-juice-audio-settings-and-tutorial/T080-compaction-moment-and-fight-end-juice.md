---
id: T080
epic: E011
title: Compaction moment and fight-end juice
summary: "The dimmed \"Compacting conversation…\" moment with typed text and bar drain, victory sweep, ^C defeat cut, enemy strike-through, Deadline pulse and typed event text."
keywords: ["juice", "compaction", "typed-text", "victory", "defeat"]
type: task
status: backlog
priority: p2
model: opus
size: M
depends_on: [T079, T060]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T080: Compaction moment and fight-end juice

## Goal

Compaction, the key context event, gets an unmistakable moment, and fight ends read instantly.

## Context

- Epic: [E011](EPIC.md)
- [Juice and audio: Compaction moment, Victory, Defeat, Typed text](../../../docs/game/ux/juice-audio.md#juice-catalogue)
- [Context: Auto-compaction (UI moment)](../../../docs/game/systems/context.md#auto-compaction-overflow)
- Code: `src/render-fx/`, `src/ui/combat/`
- Out of scope: Boss layer breaks and particles (E019).

## Acceptance Criteria

- [ ] A compaction event shows the dimmed moment typed at 60 chars/s (auto 1000 ms, planned 500 ms at 1x) with the bar drain
- [ ] Victory sweep, defeat ^C cut, enemy strike-through, Deadline pulse and typed text follow the catalogue
- [ ] Shake never runs during the compaction moment; with reduced motion only text shows (tests)

## Subtasks

- [ ] Compaction overlay
- [ ] Fight-end effects
- [ ] Typed text component

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
