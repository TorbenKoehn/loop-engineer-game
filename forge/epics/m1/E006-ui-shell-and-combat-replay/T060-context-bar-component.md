---
id: T060
epic: E006
title: Context bar component
summary: "Full-width context bar with baseline, signal and hatched noise segments, 25%/70% ticks, policy marker, F/W and zone label, noise source hover and policy-disabled warning."
keywords: ["context-bar", "ui", "zones", "noise", "policy"]
type: task
status: backlog
priority: p1
model: sonnet
size: S
depends_on: [T059, T029]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T060: Context bar component

## Goal

The context bar is the slice's central readability test (exit criterion 3), so it must show every quantity the sim uses.

## Context

- Epic: [E006](EPIC.md)
- [Screens: Combat screen (Context bar)](../../../../docs/game/ux/screens.md#combat-screen)
- [Art direction: Zone encoding](../../../../docs/game/ux/art-direction.md#zone-encoding-colour--pattern--label)
- [Context: UI fallback (not built here)](../../../../docs/game/systems/context.md#ui-fallback-variant-c-presentation)
- Code: `src/ui/combat/context-bar.tsx`
- Out of scope: Chunked fallback rendering (only if playtests fail), compaction moment (E011).

## Acceptance Criteria

- [ ] The bar shows baseline, signal and hatched noise segments, ticks at 25% and 70%, the policy marker and F/W with the zone label, always visible
- [ ] Hovering a noise segment shows its source ("Context Drift: 6k")
- [ ] Zone colour, pattern and label update on zoneChanged, and a warning shows when the policy is disabled
- [ ] A UI unit test renders the bar from folded views for each zone

## Subtasks

- [ ] Segments
- [ ] Ticks and marker
- [ ] Hover sources

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
