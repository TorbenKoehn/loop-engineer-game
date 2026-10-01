---
id: E009
title: Run screens and build panel
summary: "All non-combat slice screens: title, harness and prompt pick, map, rewards, shop, Standup, Idle Cycle, Free Tier, build panel with 6 s preview, run-end summary with one hint, AGENTS.md (M1)."
keywords: ["ui", "screens", "map", "shop", "build-panel", "run-end", "m1"]
type: epic
status: backlog
priority: p1
updated: 2026-10-01
related: ["../../../docs/game/ux/screens.md", "../../../docs/architecture/ui.md", "../../../docs/game/ux/onboarding.md", "../../../docs/game/systems/harness-loadout.md", "../../../docs/game/vertical-slice.md"]
---

# E009: Run screens and build panel

## Goal

M1 vertical slice. After this epic a player can play a full Phase-1 run in the browser from the title screen to the run-end summary and AGENTS.md, making every build decision through the build panel with its preview.

## Scope

- Title, harness select, system prompt pick ([screens](../../../docs/game/ux/screens.md))
- Map with reachable nodes and encounter hover
- Reward, discard, shop, Standup, Idle Cycle and Free Tier screens
- Build panel (explorer) with drag and keyboard reorder, stash, policy, breakpoints, 6 s preview ([loadout](../../../docs/game/systems/harness-loadout.md))
- Run-end summary with cause, top sources, zones and one hint; AGENTS.md screen ([onboarding](../../../docs/game/ux/onboarding.md))

## Out of Scope

- History, codex, daily and unlock screens (E015–E017)
- Tutorial pauses, settings, keyboard map and juice (E011)
- Full-run Playwright smoke (E010)

## Definition of Done

- [ ] All E009 tasks done with approved reviews
- [ ] Playwright: a run started from the title reaches the map, a fight, a reward and the run end
- [ ] Every screen sets initial focus and has a keyboard path for its actions
- [ ] No hard-coded player text outside t() (lint test from localisation rule 1)
