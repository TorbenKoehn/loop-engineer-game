---
id: T082
epic: E011
title: "Settings overlay: volume, reduced motion, CRT"
summary: "Settings overlay from title and top bar with master and SFX volume, reduced motion following the OS by default, and the CRT overlay toggle, persisted in the meta save."
keywords: ["settings", "accessibility", "reduced-motion", "crt", "audio"]
type: task
status: backlog
priority: p2
model: opus
size: M
depends_on: [T079, T081, T053]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T082: Settings overlay: volume, reduced motion, CRT

## Goal

The M1 settings subset lets players adjust sound and motion, persisted across sessions.

## Context

- Epic: [E011](EPIC.md)
- [Accessibility: Settings](../../../docs/game/ux/accessibility.md#settings-defaults-in-bold)
- [Vertical slice: Settings row](../../../docs/game/vertical-slice.md#in-scope)
- [Juice: CRT overlay](../../../docs/game/ux/juice-audio.md#juice-catalogue)
- Code: `src/ui/screens/settings.tsx`, `src/render-fx/crt.ts`
- Out of scope: All other settings and tabs (E020), themes (E021).

## Acceptance Criteria

- [ ] Settings opens from the title and the top bar with master and SFX volume, reduced motion and CRT; values persist in the meta save across reloads (Playwright)
- [ ] Reduced motion defaults to the OS prefers-reduced-motion value
- [ ] The CRT overlay (3 px scanlines at 6%, vignette) is off by default and toggles live
- [ ] The arch test confirms the sim never reads settings

## Subtasks

- [ ] Overlay and focus trap
- [ ] Settings store
- [ ] CRT layer

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
