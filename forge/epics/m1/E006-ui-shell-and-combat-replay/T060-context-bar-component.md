---
id: T060
epic: E006
title: Context bar component
summary: "Full-width context bar with baseline, signal and hatched noise segments, 25%/70% ticks, policy marker, F/W and zone label, noise source hover and policy-disabled warning."
keywords: ["context-bar", "ui", "zones", "noise", "policy"]
type: task
status: done
priority: p1
model: sonnet
size: S
depends_on: [T101, T029]
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

- [x] The bar shows baseline, signal and hatched noise segments, ticks at 25% and 70%, the policy marker and F/W with the zone label, always visible
- [x] Hovering a noise segment shows its source ("Context Drift: 6k")
- [x] Zone colour, pattern and label update on zoneChanged, and a warning shows when the policy is disabled
- [x] A UI unit test renders the bar from folded views for each zone

## Subtasks

- [x] Segments
- [x] Ticks and marker
- [x] Hover sources

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (sonnet)
- 2026-10-01: AC1 verified: e2e "Context bar shows zone, ticks..." (base segment, ticks 25%/70%, F/W, zone label; combat.spec.ts) and context-bar.test.tsx (segments, ticks, policy marker, F/W)
- 2026-10-01: AC2 verified: e2e hovers .ctx__seg--noise and reads tooltip "Context Drift: Nk"; unit test checks the same label
- 2026-10-01: AC3 verified: context-bar.test.tsx zone cases (4) + policyOff warning case; zoneChanged folded in context.ts
- 2026-10-01: AC4 verified: npx vitest run context-bar (7 passed); npm run check exit 0 (798 tests), build 0, e2e 21 passed
- 2026-10-01: status bar ctx now live (store/playback.ts ctxLive); harness:diff production=326 total=444
- 2026-10-01: review requested
- 2026-10-01: done (R078)
