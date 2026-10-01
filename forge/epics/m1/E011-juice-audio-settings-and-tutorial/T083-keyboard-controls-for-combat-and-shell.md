---
id: T083
epic: E011
title: Keyboard controls for combat and shell
summary: "Scoped useHotkeys bindings: Space pause, 1-4 speeds, L log, B build drawer, Esc close overlays, inactive while typing, with focus trapping in overlays."
keywords: ["keyboard", "input", "hotkeys", "accessibility", "controls"]
type: task
status: backlog
priority: p2
model: sonnet
size: S
depends_on: [T101, T111]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T083: Keyboard controls for combat and shell

## Goal

The basic M1 keys make combat and the shell usable without a mouse.

## Context

- Epic: [E011](EPIC.md)
- [Accessibility: Keyboard map](../../../../docs/game/ux/accessibility.md#keyboard-map-defaults-remappable)
- [UI: Input](../../../../docs/architecture/ui.md#input)
- Code: `src/ui/input/`
- Out of scope: Remapping (E020), keyboard-only full-run test (E020).

## Acceptance Criteria

- [ ] Space pauses, 1-4 set 1x/2x/4x/skip, L toggles the log, B toggles the build drawer and Esc closes overlays (UI tests)
- [ ] Bindings are scoped per screen and do not fire while typing in inputs
- [ ] Overlays trap focus and restore it on close

## Subtasks

- [ ] useHotkeys
- [ ] Bindings
- [ ] Focus trap

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
