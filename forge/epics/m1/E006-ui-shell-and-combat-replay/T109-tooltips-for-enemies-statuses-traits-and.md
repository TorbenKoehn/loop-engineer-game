---
id: T109
epic: E006
title: Tooltips for enemies, statuses, traits and zones
summary: "Enemy, status, trait and context-zone tooltips on the T062 component, with keyboard-focusable noise segments on the context bar and a Playwright check in the combat screen."
keywords: ["tooltips", "enemies", "statuses", "traits", "zones", "context-bar", "accessibility"]
type: task
status: backlog
priority: p2
model: opus
size: M
depends_on: [T062]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T109: Tooltips for enemies, statuses, traits and zones

## Goal

After T062 explains items, this task explains the other side of the fight: every enemy,
status, trait and context zone gets a tooltip with name, plain-English line and stats, so
no number on the combat screen is unexplained.

## Context

- Epic: [E006](EPIC.md); [Screens: Tooltips](../../../../docs/game/ux/screens.md#tooltips-and-the-combat-log)
- `src/ui/tooltip/` (T062's component and describers), `src/content/text/`
- `src/ui/combat/view/arena.tsx`, `src/ui/combat/view/context-bar.tsx` (paths after T105)
- [Accessibility](../../../../docs/game/ux/accessibility.md)
- Out of scope: item tooltips (T062); Codex (E017); screen-reader verbose mode (E020); tooltips outside the combat screen.

## Acceptance Criteria

- [ ] UI test passes: enemy cards show a tooltip with name, plain-English line and stats on hover and on keyboard focus
- [ ] UI test passes: status and trait chips show a tooltip with name, plain-English line and stats
- [ ] UI test passes: context-bar zones and noise segments open their tooltip on keyboard focus and reference it via `aria-describedby`
- [ ] Playwright passes: in the combat screen, focusing an enemy card shows a tooltip containing the name read from that card (no pinned numbers)

## Subtasks

- [ ] Enemy describer (stats, traits, stages)
- [ ] Status and trait describers
- [ ] Zone and noise-segment tooltips on the context bar
- [ ] e2e

## Notes

- Orchestrator 2026-10-01 (R083 minor, carried over from T062): combat log prints raw boss stage ids ("stage b 2") - use the stage name; log hint says "rewind" but keys move both ways.
- Orchestrator 2026-10-01 (R078 F1, carried over from T062): make the context-bar noise-segment tooltips keyboard-focusable and screen-reader accessible (they are hover-only; fix the wrong code comment in context-bar.tsx). Covered by AC 3.
- 2026-10-01: Split from T062 (RT005 re-size), ~200 production lines. Meets the Definition of Ready; promote when T062 is done.

## Log

- 2026-10-01: created
