---
title: Screens and layout
summary: IDE-style shell layout and the content of every screen - title, harness select, map, combat, rewards, shop, event, rest, build panel, run end, history, settings.
keywords: [ux, ui, screens, layout, combat-view, ide, flow]
type: gdd
status: active
updated: 2026-10-01
related: [art-direction.md, juice-audio.md, accessibility.md, onboarding.md, ../systems/combat.md, ../../architecture/ui.md]
---

# Screens and layout

## Contents
- Shell layout
- Screen flow
- Combat screen
- Other screens
- Tooltips and the combat log

## Shell layout

The whole game lives in one IDE-like shell. Base viewport 1280 × 720; supported
1024 × 640 up to 4K (layout scales with text size; no canvas scaling of text).

```
┌ top bar 32px: breadcrumb  phase-1/implement › row 3      seed  ⚙ ┐
│ EXPLORER 240px │ EDITOR (current screen)                          │
│ loadout tree   │                                                  │
│ tools/skills/  │                                                  │
│ memory/stash   │                                                  │
│ breakpoints    ├──────────────────────────────────────────────────┤
│                │ TERMINAL 180px (collapsible): log / event text   │
└ status bar 24px (--brand bg): ♥ Trust 64/80 · $ 23 · ctx 24/60 · P1 · lint 0 · 1x ┘
```

- The explorer is the always-available **build panel** (collapsed to icons during
  combat; editing is disabled in combat).
- The status bar is red (`--brand`) like an editor status bar, the main brand surface.
- Below 1100 px width the explorer becomes a drawer (`B` key).

## Screen flow

`Title -> (first run: Tutorial intro) -> Harness select -> System prompt pick -> Map ->
node screen -> Map … -> Run end -> AGENTS.md -> Summary -> Title`. Settings, codex and
history open from the title and from the top bar as overlays.

## Combat screen

```
 ctx [██████████▒▒▒##········|·····]  F 41/60  ROT ~   policy ▲80%     00:18.350  ⏸ 1x 2x 4x ⏭
 ┌ AGENT ┐                                   ┌ Typo ┐ ┌ Context Drift ┐
 │ art   │  ♥ 64/80  ⛨ 6                    │ art  │ │ art           │
 └───────┘                                   │ 12/30│ │ 140/140       │
 [grep v2 ▓▓▓░] | [cat v1 ▓░░░] | [sed v1 ▓▓░░]   │⚔2 1.2s│ │≋6 noise 2.9s │
```

- **Context bar** (top, full width, 40 px): baseline segment (darker), signal segments in
  the current zone pattern, noise segments hatched grey and labelled on hover; ticks at
  25% and 70%; the compaction policy as a red `▲` marker; numeric `F/W` and zone label
  always visible.
- **Agent card** (left): portrait, Trust (red, with `♥`), Guardrails (cyan, `⛨`), status
  chips (`Haste 1.2s`, `Stun`).
- **Tool row**: cards in slot order. Each shows name, version badge, cooldown bar
  (fills left to right), next effect value, output `+2k`, status chips. Pipes render as
  `|` between cards and flash when they transfer charge.
- **Enemy line** (right): front enemy nearest to the centre. Each card: portrait, name,
  Severity bar (`--enemy`), Guardrails/armor, trait chips, **intent chip** (verb icon,
  value, countdown ring). Intent icons: `⚔` hit, `≋` noise, `⏸` throttle, `✱` stun,
  `⛨` guard, `+` spawn, `↺` redirect.
- **Clock**: `mm:ss.mmm`, turns amber 10 s before the Deadline and red after it.
- **Controls**: pause, 1x, 2x, 4x, skip. Speed persists between fights.
- After the fight: a result strip ("Resolved in 27.4 s · −12 Trust · 2 compactions") and
  a **Continue** button; the log stays open for review.

## Other screens

| Screen | Presentation | Key elements |
|---|---|---|
| Title | Terminal prompt `$ loop-engineer` with logo | New run, Continue, Daily, History, Codex, Settings |
| Harness select | Config-file cards side by side | Stats, trait, difficulty tag, wins, lock reason |
| System prompt | Three quoted prompt cards | Weight, effect line |
| Map | Vertical DAG, bottom to top, box-drawing edges | Node icons, current node red, reachable nodes pulse, hover shows encounter |
| Rewards | "PR ready to merge": 3 diff-style cards | Pick 1, Skip (+6), credits receipt incl. interest |
| Package Registry | Package list (`grep@2.0.0`) | 5 offers, price, sale tag, Reroll (cost), Prune, sell drop zone |
| Standup | Chat thread in `#standup` | Speaker, ≤ 3 lines, reply buttons with exact outcomes |
| Idle Cycle | `$ sleep 30` with a progress bar | Heal or Upgrade (tool picker) |
| Free Tier | Unboxing a memory | Item card, equip or stash |
| Run end | `^C` (loss) or `Shipped!` (win), 64 px red | Cause, damage-by-source bars, time per zone, TD receipt |
| AGENTS.md | A Markdown file editor | 3 lesson lines to pick, replace when full |
| History | Table of past runs | Filter by harness, replay button |
| Codex | Glossary + every seen item/enemy | Plain-English lines, stats |
| Settings | Tabs: Gameplay, Video, Audio, Accessibility, Controls | See [accessibility](accessibility.md) |

## Tooltips and the combat log

- Every item, enemy, status, trait and zone has a tooltip: name, one plain-English line,
  stats, and the damage formula with current numbers (`6 base +3 flat ×(100+20+30)% = 14`).
  Tooltips open on hover after 250 ms or on keyboard focus.
- The log is the show: one line per event, coloured by source, filterable
  (All / Damage / Context / Enemies). Format:
  `[00:12.350] grep v2 -> Context Drift: 14 dmg (Focused +20%, piped +30%)`.
- Clicking a log line pauses playback and highlights the units involved.
