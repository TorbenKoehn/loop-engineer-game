---
id: T056
epic: E006
title: Crimson theme tokens and typography
summary: "Crimson colour and zone tokens as CSS custom properties, self-hosted JetBrains Mono at the documented sizes, and reusable zone encoding classes (colour, pattern, label)."
keywords: ["theme", "css", "tokens", "typography", "crimson", "zones"]
type: task
status: in-progress
priority: p1
model: sonnet
size: S
depends_on: [T055]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T056: Crimson theme tokens and typography

## Goal

Give every screen the slice look from one token set, so later themes only swap tokens.

## Context

- Epic: [E006](EPIC.md)
- [Art direction: Colour tokens, Zone encoding, Typography](../../../../docs/game/ux/art-direction.md#colour-tokens-crimson-default-dark-theme)
- [Accessibility: Colour and contrast](../../../../docs/game/ux/accessibility.md#colour-and-contrast)
- Code: `src/ui/theme/`, `index.html`
- Out of scope: Other themes and text-size setting (E020, E021), CRT overlay (E011).

## Acceptance Criteria

- [ ] All Crimson and zone tokens from art-direction.md are custom properties on :root, and components use no raw hex colours (grep evidence)
- [ ] JetBrains Mono 400/700 latin subset is self-hosted, ≤ 100 kB, base 15 px, line height 1.45
- [ ] Zone classes combine colour, pattern and label for Cold, Focused, Rot and Overflow

## Subtasks

- [ ] Token sheet
- [ ] Font files and @font-face
- [ ] Zone classes

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (sonnet)
