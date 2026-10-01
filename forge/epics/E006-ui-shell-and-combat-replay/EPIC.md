---
id: E006
title: UI shell and combat replay
summary: "Preact + signals DOM UI: app shell, harness select, map, build and shop screens, CombatView replaying the event log at 1x/2x/4x/skip, Canvas2D juice overlay, Playwright coverage."
keywords: ["ui", "preact", "signals", "replay", "canvas", "playwright"]
type: epic
status: backlog
priority: p1
updated: 2026-10-01
related: ["../../../docs/research/game/game-design-proposal.md", "../../../docs/research/game/tech-stack.md"]
---

# E006: UI shell and combat replay

## Goal

Make the game playable in the browser: screens that read sim state and dispatch actions, and a combat view that replays the event log with readable intents, context bar and combat log.

## Scope

- App shell, screen switching, signals store
- Harness select, map, build, shop, reward and event screens
- CombatView: playback clock, pause, speed, skip, text log and tooltips
- Context bar and intent display
- Canvas2D overlay with number pops and shake, honouring reduced motion
- Playwright e2e on text and roles

## Out of Scope

- Sim logic changes (E002-E004)
- Audio polish and extra themes
- Mobile layout and meta screens

## Definition of Done

- [ ] A full run is playable from harness select to Release in the browser
- [ ] Combat replay matches the event log at every speed
- [ ] Playwright e2e covers start, one fight, shop and defeat
- [ ] Reduced-motion setting disables juice effects
