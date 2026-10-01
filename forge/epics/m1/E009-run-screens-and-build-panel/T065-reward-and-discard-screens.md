---
id: T065
epic: E009
title: Reward and discard screens
summary: "PR-style reward screen with 3 diff cards, Skip (+6) and a credits receipt with interest, plus the discard screen when a gained item has no space."
keywords: ["ui", "rewards", "discard", "credits", "screens"]
type: task
status: done
priority: p2
model: sonnet
size: S
depends_on: [T064, T043]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T065: Reward and discard screens

## Goal

After a win the player sees exactly what was earned and makes the pick decision.

## Context

- Epic: [E009](EPIC.md)
- [Screens: Rewards row](../../../../docs/game/ux/screens.md#other-screens)
- [Economy: Income (interest line)](../../../../docs/game/systems/economy.md#income)
- Code: `src/ui/screens/reward.tsx`, `src/ui/screens/discard.tsx`
- Out of scope: First-time tips (E020).

## Acceptance Criteria

- [x] After a won fight the reward screen shows 3 diff-style cards, Skip (+6) and a receipt with an Interest line
- [x] Picking dispatches pickReward and a duplicate shows "v1 → v2"
- [x] The discard screen appears when an item has no space and dispatches discardItem

## Subtasks

- [x] Reward cards
- [x] Receipt
- [x] Discard

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (sonnet)
- 2026-10-01: AC1 verified: npx playwright test reward (3 diff cards, 'Skip (+6 Credits)', receipt Reward/Interest/Total); npm run e2e (12 passed)
- 2026-10-01: AC2 verified: e2e 'a duplicate tool shows v1 → v2' + 'picking a card dispatches pickReward'; vitest reward.test.ts nextVersion (3 passed)
- 2026-10-01: AC3 verified by unit test only: discard.tsx wired for mode discard, buttons dispatch discardItem (reward.test.ts describeRef); unreachable in e2e (needs a full loadout, no test hook yet)
- 2026-10-01: npm run build ok; npm run check steps 1-3 ok, step 4 harness fails only on pre-existing forge/reviews/E002/R066-T024.md fm_summary_chars (not mine)
- 2026-10-01: review requested
- 2026-10-01: done (R069)
