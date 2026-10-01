---
title: Art direction and palette
summary: Terminal/IDE look with crimson as the signature colour - exact hex tokens for dark, high-contrast and light themes, contrast checks, zone encodings, typography and ASCII art rules.
keywords: [art-direction, palette, red, colour-tokens, typography, ascii-art, accessibility]
type: gdd
status: active
updated: 2026-10-01
related: [screens.md, juice-audio.md, accessibility.md, ../systems/context.md]
---

# Art direction and palette

## Contents
- Look in one sentence
- Principles
- Colour tokens: "Crimson" (default dark theme)
- Zone encoding (colour + pattern + label)
- Other themes
- Typography
- ASCII art
- Logo

## Look in one sentence

A near-black terminal and IDE, lit by **crimson**: the player's agent, the cursor, the
logo, the status bar and every highlight are red; cyan means "good", amber means
"careful", and nothing important is told by colour alone.

## Principles

1. **Red is the brand.** Title, logo, cursor, agent portrait, Trust, primary buttons,
   selection, focus rings, the status bar and danger zones are red.
2. **Cyan is the counterweight.** Positive states (Guardrails, healing, Focused zone,
   "OK") are cyan, which is distinct from red for all common colour-vision deficiencies
   and in luminance.
3. **Never colour alone.** Every state also has a glyph, a label or a pattern.
4. **Text first.** Monospace text, box-drawing characters and ASCII art; no sprites.
5. **Motion explains.** Every animation points at a cause (see [juice](juice-audio.md)).

## Colour tokens: "Crimson" (default dark theme)

Contrast ratios are against `--bg` (WCAG 2.x formula). AA needs 4.5 for body text and
3.0 for large text and UI parts.

| Token | Hex | Use | Contrast |
|---|---|---|---|
| `--bg` | `#0B0809` | Page background (warm near-black) | — |
| `--bg-panel` | `#141012` | Panels, cards | — |
| `--bg-raised` | `#1D1719` | Hover, tooltips | — |
| `--border` | `#3A2A2E` | Panel borders, separators | UI only |
| `--fg` | `#EDE6E7` | Body text | 16.2 |
| `--fg-muted` | `#A8999C` | Secondary text | 7.3 |
| `--brand` | `#D91E36` | Fills: buttons, status bar, agent card frame | 4.0 (UI) |
| `--brand-text` | `#FF4D5E` | Red text, Trust number, logo, focus ring | 6.1 |
| `--brand-deep` | `#8E1426` | Selected rows, pressed buttons | UI only |
| `--on-brand` | `#FFFFFF` | Text on `--brand` | 5.0 on brand |
| `--good` | `#3DD6D0` | Guardrails, healing, Focused, "OK" | 11.1 |
| `--warn` | `#F2A93B` | Rot zone, Throttle, Deadline warning | 10.0 |
| `--danger` | `#FF2D45` | Overflow, Deadline active, `^C` screen | 5.4 |
| `--cold` | `#5B8DEF` | Cold zone | 6.2 |
| `--noise` | `#6E6467` | Noise segments (with hatch pattern) | 3.5 (UI) |
| `--enemy` | `#B48CFF` | Severity bars and enemy names | 7.7 |
| `--credits` | `#F2D16B` | Credits | 13.4 |

Tokens live as CSS custom properties on `:root[data-theme]`. Components never use raw
hex values.

## Zone encoding (colour + pattern + label)

| Zone | Colour | Fill pattern | Label | Edge glyph |
|---|---|---|---|---|
| Cold | `--cold` | dotted `░` | `COLD` | `*` |
| Focused | `--good` | solid `█` | `FOCUSED` | `=` |
| Rot | `--warn` | hatched `▒` | `ROT` | `~` |
| Overflow | `--danger` | dense `▓`, blinking at 2 Hz (off in reduced motion) | `OVERFLOW` | `!` |
| Noise | `--noise` | diagonal hatch | source name on hover | `#` |

## Other themes

| Token | High contrast | Paper (light, unlock) | Amber Terminal (unlock) | Phosphor (unlock) |
|---|---|---|---|---|
| `--bg` | `#000000` | `#F7F2F0` | `#0D0A05` | `#050A06` |
| `--fg` | `#FFFFFF` | `#1A1214` | `#FFD9A0` | `#C8F7C5` |
| `--brand` | `#FF3347` | `#B3122A` | `#D91E36` | `#D91E36` |
| `--brand-text` | `#FF6B78` | `#A3102A` | `#FF5A69` | `#FF5A69` |
| `--good` | `#00F0FF` | `#006E6A` | `#5FE0D8` | `#5FE0D8` |
| `--warn` | `#FFC233` | `#8A5300` | `#FFB84D` | `#F2C14E` |

Every theme must pass the same contrast test (unit test over the token table). Red stays
the brand colour in every theme.

## Typography

- One family: JetBrains Mono (self-hosted, weights 400 and 700, latin subset, ≤ 100 kB).
- Optional UI font setting "Readable" switches prose (tooltips, events) to the system
  sans-serif stack; numbers and code stay monospace.
- Base size 15 px at 100% text scale; line height 1.45. Sizes: 12 (meta), 15 (body),
  18 (headings), 28 (numbers on cards), 64 (title and `^C`).
- Text scale setting: 90 / 100 / 115 / 130 / 150%.

## ASCII art

- Agent portrait: 7 lines × 14 columns, drawn in `--brand-text`, one per harness
  (alternatives via cosmetic unlocks). Blinking cursor `█` as the "eye".
- Enemy portraits: max 6 lines × 14 columns in `--enemy`; bosses 10 × 24.
- Only printable ASCII plus box-drawing (`─│┌┐└┘├┤`) and block elements (`░▒▓█`).
- Art is data (string arrays in content), so it is diffable and testable.

```
  .------.      Typo        ____
 | >_ █  |     (o_O)       |####|  Legacy
 |  __   |     /|\ ~       |#  #|  Monolith
 '------'      / \         |####|
```

## Logo

`LOOP ENGINEER` in a block-letter ASCII font, `--brand-text`, followed by a blinking red
block cursor and a loop arrow `↻`. The favicon is a red `>_` on `--bg`.
