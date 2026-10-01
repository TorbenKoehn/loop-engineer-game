---
id: E006
title: UI shell and combat replay
summary: "Preact + signals UI core: store and dispatch, IDE shell, i18n t(), Crimson theme, test hooks, replay player with view fold, combat screen, context bar, combat log and tooltips (M1)."
keywords: ["ui", "preact", "signals", "replay", "combat-view", "tooltips", "m1"]
type: epic
status: backlog
priority: p1
milestone: m1
updated: 2026-10-01
related: ["../../../../docs/architecture/ui.md", "../../../../docs/game/ux/screens.md", "../../../../docs/game/ux/art-direction.md", "../../../../docs/architecture/event-log.md", "../../../../docs/game/vertical-slice.md"]
---

# E006: UI shell and combat replay

## Goal

M1 vertical slice. After this epic a fight can be watched in the browser inside the IDE shell: the replay player plays the event log at 1x/2x/4x/skip with pause and seeking, and the combat screen, context bar, log and tooltips explain every number. Run screens build on this shell (E009).

## Scope

- Signals store, dispatch, App mode switch, IDE shell, `t()` ([UI architecture](../../../../docs/architecture/ui.md))
- Crimson theme tokens, typography, zone encoding ([art direction](../../../../docs/game/ux/art-direction.md))
- window.__game test hooks and URL flags (dev and e2e builds only)
- Replay player with injectable clock, view fold, checkpoints and seeking
- Combat screen, context bar, combat log and tooltips ([screens](../../../../docs/game/ux/screens.md))

## Out of Scope

- Map, reward, shop, event, rest, build panel, run-end screens (E009)
- Juice, audio, settings and keyboard map (E011)
- Other themes, text-size setting, screen-reader summaries (M3)

## Definition of Done

- [ ] All E006 tasks done with approved reviews
- [ ] Replay test: the folded view after skip equals the fightEnd state for a reference fight
- [ ] In the browser a fight replays at every speed with a readable log line per event
- [ ] src/ui logic modules (store, playback, fold, i18n) line coverage ≥ 70%
