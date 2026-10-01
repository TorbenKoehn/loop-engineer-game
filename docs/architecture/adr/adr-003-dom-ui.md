---
title: ADR-003 DOM UI over a game engine
summary: Render all screens, including combat, as Preact DOM components styled as a terminal/IDE, with a single Canvas2D overlay for particles and flashes.
keywords: [adr, ui, dom, preact, canvas, accessibility]
type: adr
status: active
updated: 2026-10-01
related: [adr-001-tech-stack.md, ../ui.md, ../../game/ux/art-direction.md, ../../game/ux/accessibility.md]
---

# ADR-003: DOM UI over a game engine

Status: accepted, 2026-10-01.

## Context

The game's look is a terminal/IDE: text, panels, tables, tooltips, a scrolling log and
ASCII art, with juice on top. It must be keyboard- and screen-reader-accessible, scale
text to 150%, support localisation, and be testable by agents via text and roles.
There are at most 1 agent and 5 enemies on screen and no sprites.

## Decision

- All screens, including the combat view, are Preact DOM components with CSS grid and
  CSS custom properties for themes.
- Bars animate via `transform: scaleX()`; animations use the Web Animations API.
- One full-screen `<canvas>` overlay (pointer-events none) draws particles, number-pop
  sparkle, flashes and the optional CRT effect. Screen shake is a CSS transform.
- The fx layer sits behind an `Fx` interface so it can be swapped for PixiJS if Canvas2D
  is ever too slow.

## Consequences

- Text layout, wrapping, selection, focus, ARIA roles and font scaling come for free.
- Playwright asserts on text and roles; visual tests are limited to a few screens.
- Localisation and pseudo-locale testing work on real DOM text.
- We must guard performance at 4x playback: no layout thrash, pooled pops, virtualised
  log (budgets in [UI architecture](../ui.md)).
- Risk: a DOM combat view may feel static. Mitigation: invest early in juice (M1 already
  ships pops, shake, hit-stop, typed text and the compaction moment).

## Alternatives considered

- **Phaser 4 scenes for combat, DOM for menus**: two UI paradigms, text rendering in
  canvas, harder accessibility and testing; logic tends to leak into scenes.
- **PixiJS for the whole game**: great rendering, but we would rebuild layout, text input,
  focus and accessibility.
- **Pure terminal in a canvas (xterm-like)**: authentic but inaccessible, hard to
  localise and hard to test.
