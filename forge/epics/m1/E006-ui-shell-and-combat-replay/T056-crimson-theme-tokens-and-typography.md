---
id: T056
epic: E006
title: Crimson theme tokens and typography
summary: "Crimson colour and zone tokens as CSS custom properties, self-hosted JetBrains Mono at the documented sizes, and reusable zone encoding classes (colour, pattern, label)."
keywords: ["theme", "css", "tokens", "typography", "crimson", "zones"]
type: task
status: done
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

- [x] All Crimson and zone tokens from art-direction.md are custom properties on :root, and components use no raw hex colours (grep evidence)
- [x] JetBrains Mono 400/700 latin subset is self-hosted, ≤ 100 kB, base 15 px, line height 1.45
- [x] Zone classes combine colour, pattern and label for Cold, Focused, Rot and Overflow

## Subtasks

- [x] Token sheet
- [x] Font files and @font-face
- [x] Zone classes

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (sonnet)
- 2026-10-01: AC1 verified: 17 tokens on :root[data-theme=crimson] (contrast.test.ts matches art-direction table); theme.test.ts asserts no raw hex in src css/tsx outside crimson.css
- 2026-10-01: AC2 verified: public/fonts 400+700 latin woff2 (21168+21908 B, OFL license file); --size-body 15px, --line 1.45; fonts.css @font-face
- 2026-10-01: AC3 verified: zones.css .zone--cold/focused/rot/overflow set colour token, pattern, label+glyph (theme.test.ts)
- 2026-10-01: npm run check, build, e2e green
- 2026-10-01: review requested
- 2026-10-01: done (R042)
