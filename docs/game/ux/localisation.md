---
title: Localisation-ready strings
summary: Rules that keep all player-facing text localisable - string tables, keys, placeholders, plurals, number formatting, generated effect text, pseudo-locale testing.
keywords: [localisation, i18n, strings, plurals, pseudo-locale, text]
type: gdd
status: active
updated: 2026-10-01
related: [accessibility.md, screens.md, ../../architecture/content-model.md, ../../architecture/ui.md]
---

# Localisation-ready strings

Ship language: English. Goal: adding a language later needs only new string files and a
font fallback, no code changes.

## Rules

1. **No hard-coded player text** in components or sim. Components call `t(key, params)`.
   A lint test fails on JSX text nodes with letters outside `t()` (allow-list: symbols
   and numbers).
2. **Keys** are stable, dotted, lower-case: `ui.shop.reroll`, `tool.grep.name`,
   `tool.grep.flavour`, `enemy.typo.intent.nitpick`, `event.pasted_log.choice.a`.
3. **Placeholders** are named, never positional: `"Reroll ({cost} Credits)"`.
   No string concatenation to build sentences.
4. **Plurals** use `Intl.PluralRules` with suffixed keys: `ui.credits.one` /
   `ui.credits.other`. Every count-bearing string has both.
5. **Numbers, times and percentages** go through `Intl.NumberFormat` helpers; the sim's
   integer ms are formatted by `formatClock(ms)` (`00:12.350`).
6. **Generated effect text**: tooltips and plain-English lines are built from the effect
   DSL using one template per effect kind (`effect.dmg.front = "Deal {n} damage to the
   front enemy."`). Translators translate templates, not every item.
7. **Sim never produces text.** The event log carries ids and numbers; the UI renders text.
8. **Jokes** carry a translator note (`// joke: parody of a famous Q&A site`) so they can
   be adapted rather than translated.
9. **Glyph independence**: icons (`♥ ⛨ ⚔ ≋`) are separate from words, so word order can
   change around them.

## String files

- `src/content/strings/en.ts` exports a flat `Record<StringKey, string>` with
  `as const` so keys are typed; missing keys fail type-checking for `en`.
- Other locales are `Partial<Record<StringKey, string>>` and fall back to `en`.
- Content data references keys, not literal text, except for ids.
- Expected size at full content: about 1600 strings.

## Layout tolerance

- All text containers tolerate +35% length without clipping (German-style expansion);
  verified with the pseudo-locale.
- No text inside images or the canvas, except juice number pops (digits only).
- Right-to-left scripts are out of scope until after M3; layout uses logical CSS
  properties (`margin-inline-start`) anyway.

## Pseudo-locale

`?locale=pseudo` renders every string as `[!! Ŕéŕöļļ ({cost}) Çŕéðîţš ~~~~ !!]`
(accented, +35% padding, bracketed). A Playwright smoke run in the pseudo-locale checks
that no raw key, no un-bracketed English and no clipped container appears on the main
screens.

## Fonts

JetBrains Mono covers Latin, Greek and Cyrillic. Locales outside that fall back to the
system monospace stack; the font budget (≤ 100 kB) applies to the default build only.
