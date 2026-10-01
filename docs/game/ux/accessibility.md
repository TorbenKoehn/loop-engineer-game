---
title: Settings, accessibility and controls
summary: Full settings list with defaults, accessibility requirements (colour-blind safety, contrast, text size, reduced motion, screen readers) and the complete keyboard map.
keywords: [accessibility, settings, keyboard, colour-blind, reduced-motion, text-size, screen-reader]
type: gdd
status: active
updated: 2026-10-01
related: [art-direction.md, juice-audio.md, screens.md, localisation.md, ../../architecture/testing.md]
---

# Settings, accessibility and controls

## Contents
- Settings (defaults in bold)
- Colour and contrast
- Motion and flashing
- Text and reading
- Screen readers
- Keyboard map (defaults, remappable)
- Other

Target: WCAG 2.2 AA for all UI text and controls, plus game-specific guidance (Game
Accessibility Guidelines "basic" and most "intermediate" items). Accessibility options
are never locked behind progress.

## Settings (defaults in bold)

| Tab | Setting | Values |
|---|---|---|
| Gameplay | Default combat speed | **1x**, 2x, 4x |
| Gameplay | Auto-pause at fight start | **off**, on |
| Gameplay | Pause when window loses focus | **on**, off |
| Gameplay | Confirm risky actions (sell, discard, abandon) | **on**, off |
| Gameplay | Tutorial tips | **on**, off, reset |
| Video | Theme | **Crimson**, High contrast, unlocked themes |
| Video | CRT overlay | **off**, on |
| Video | Screen shake | **on**, off |
| Video | Particles | **on**, off |
| Audio | Master / Music / SFX / UI volume | **80 / 60 / 80 / 70** |
| Audio | Mute when hidden | **on**, off |
| Audio | Visualise sounds (captions) | **off**, on |
| Accessibility | Text size | 90, **100**, 115, 130, 150% |
| Accessibility | Reduced motion | **follow system**, on, off |
| Accessibility | Reduce flashing | **on**, off |
| Accessibility | Readable font for prose | **off**, on |
| Accessibility | Colour-vision preview (dev and player) | **none**, protanopia, deuteranopia, tritanopia |
| Accessibility | Screen reader announcements | **summary**, verbose, off |
| Accessibility | Hold-to-confirm instead of double-click | **off**, on |
| Controls | Key bindings | remappable, see below |

Settings are stored in the meta save, apply live, and are reset per section.

## Colour and contrast

- Contrast: body text ≥ 4.5:1, large text and UI parts ≥ 3:1 in every theme
  (unit-tested over the token tables in [art direction](art-direction.md)).
- No meaning by colour alone: zones have labels and patterns; damage taken vs dealt has
  sign and glyph (`−12 ♥` vs `12`); intents have icons; enemies vs agent differ by side,
  frame and glyph.
- Red (brand) and cyan (good) remain distinguishable under protanopia, deuteranopia and
  tritanopia simulations; this is checked by a Playwright screenshot test with CSS
  colour-vision filters on the combat screen.

## Motion and flashing

- Reduced motion follows `prefers-reduced-motion` by default and turns off shake,
  hit-stop, particles, drains and pulsing; information is kept (see the juice table).
- Reduce flashing (default on) caps full-screen brightness changes at 10% and the
  Overflow blink becomes a steady pattern. No effect flashes more than 3 times per second.

## Text and reading

- Text size scales the whole UI via a root `font-size`; layouts must not clip at 150%
  (Playwright screenshot test at 1280 × 720 and 150%).
- All game text is selectable in the log and the codex. Typed-text animations complete on
  any key.
- Plain-English line on every tooltip; jargon is always explained in the codex.

## Screen readers

- Semantic HTML: buttons are `<button>`, menus have roles, the map is a list of
  reachable nodes with labels ("Row 3, Package Registry, reachable").
- Combat: a polite live region announces a **summary** every 3 s of playback
  ("Typo resolved. Context 41 of 60, Rot. Trust 64.") or each event in verbose mode.
  Big moments (compaction, Deadline, win, loss) are announced immediately.
- Playback speed is never forced; the verbose setting's help text recommends 1x.

## Keyboard map (defaults, remappable)

| Key | Action |
|---|---|
| `Tab` / `Shift+Tab` | Move focus |
| `Enter` / `Space` | Activate focused control |
| `Esc` | Back / close overlay / open menu |
| `Space` (combat) | Pause / resume |
| `1` `2` `3` `4` | Speed 1x, 2x, 4x, skip |
| `L` | Toggle the terminal log |
| `B` | Toggle the build panel |
| Arrow keys (map) | Move between reachable nodes; `Enter` to travel |
| `Alt+Arrow` (build panel) | Move the focused tool left or right |
| `R` (shop) | Reroll |
| `S` (shop) | Sell focused item (confirm) |
| `1`–`5` (shop, rewards, events) | Pick option n |
| `?` | Help overlay with the key map |
| `F1` | Codex |

Mouse: everything is clickable; drag and drop for loadout ordering with a keyboard
alternative for every drag.

## Other

- No time pressure outside combat; combat itself needs no input.
- Colour-vision, text-size and reduced-motion combinations are part of the M3 exit
  checklist ([milestones](../milestones.md)).
