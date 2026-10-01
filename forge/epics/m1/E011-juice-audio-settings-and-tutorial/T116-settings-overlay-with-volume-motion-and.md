---
id: T116
epic: E011
title: Settings overlay with volume, motion and CRT
summary: "Settings overlay opened from the title and the top bar with master and SFX volume, reduced motion and the CRT toggle, a live CRT layer, focus trap and Playwright persistence check."
keywords: ["settings", "overlay", "crt", "accessibility", "focus-trap"]
type: task
status: backlog
priority: p2
model: sonnet
size: M
depends_on: [T082]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T116: Settings overlay with volume, motion and CRT

## Goal

Players can adjust sound, motion and the CRT look from the title or during a run, and the
choice sticks across reloads.

## Context

- Epic: [E011](EPIC.md); [Accessibility: Settings](../../../../docs/game/ux/accessibility.md#settings-defaults-in-bold)
- [Juice: CRT overlay](../../../../docs/game/ux/juice-audio.md#juice-catalogue)
- `src/ui/store/` (T082's settings), `src/ui/screens/title.tsx`, `src/ui/shell/shell.tsx` (top bar)
- New files in `src/ui/settings/` and `src/render-fx/crt.ts`
- Out of scope: other settings and tabs (E020); the tutorial reset row (T084); themes (E021).

## Acceptance Criteria

- [ ] UI test passes: the overlay opens from the title and from the top bar gear, traps focus, and Esc closes it and restores focus
- [ ] UI test passes: the overlay shows master and SFX volume, reduced motion (follow system, on, off) and CRT, and edits the T082 settings
- [ ] UI test passes: the CRT layer (3 px scanlines at 6%, vignette) is off by default and toggles live
- [ ] Playwright passes: a changed SFX volume and CRT setting survive a page reload

## Subtasks

- [ ] Overlay and focus trap
- [ ] Controls
- [ ] CRT layer and CSS
- [ ] e2e

## Notes

- Orchestrator 2026-10-01 (R057 minor, carried over from T082): add the Settings entry on the Title screen (screens.md). Covered by AC 1.
- 2026-10-01: Split from T082 (RT005 re-size), ~180 production lines plus CSS; M because it touches 6 files. Meets the Definition of Ready; promote when T082 is done.

## Log

- 2026-10-01: created
