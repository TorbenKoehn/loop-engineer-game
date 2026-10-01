---
id: T082
epic: E011
title: Settings store persisted in the meta save
summary: "Settings (master and SFX volume, reduced motion, CRT) in the meta save with defaults for old saves, reduced motion following the OS, applied live to fx and audio, never read by the sim."
keywords: ["settings", "meta-save", "reduced-motion", "accessibility", "audio"]
type: task
status: backlog
priority: p2
model: opus
size: S
depends_on: [T079, T115, T053]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T082: Settings store persisted in the meta save

## Goal

The M1 settings subset persists across sessions and drives fx and audio live. This task
adds the store and the save field; the overlay that edits them is T116.

## Context

- Epic: [E011](EPIC.md); [Accessibility: Settings](../../../../docs/game/ux/accessibility.md#settings-defaults-in-bold)
- [Vertical slice: Settings row](../../../../docs/game/vertical-slice.md#in-scope)
- `docs/architecture/save.md`, `src/run/meta/meta.ts`, `src/save/schema.ts`, `src/ui/store/meta.ts` (paths after T105)
- `tests/arch.test.ts`
- Out of scope: the overlay and CRT layer (T116); all other settings and tabs (E020); themes (E021).

## Acceptance Criteria

- [ ] Unit test passes: master volume, SFX volume, reduced motion and CRT round-trip through the meta save, and a meta save without settings loads with the documented defaults
- [ ] Unit test with a `matchMedia` stub passes: reduced motion "follow system" uses the OS `prefers-reduced-motion` value
- [ ] Unit test passes: changing a setting updates the fx flags and the audio bus gains without a reload
- [ ] `tests/arch.test.ts` passes with a rule that `src/sim/` never imports settings

## Subtasks

- [ ] Settings type and defaults in the meta state
- [ ] Save field and backward-compatible load
- [ ] Live wiring to fx and audio

## Notes

- Orchestrator 2026-10-01 (R057 minor, carried over to T116): add the Settings entry on the Title screen (screens.md).
- 2026-10-01 (RT005 re-size): narrowed to the store and persistence (~120 production lines); overlay, entry points and CRT moved to T116.
- 2026-10-01: Meets the Definition of Ready; promote when all depends_on are done.

## Log

- 2026-10-01: created
