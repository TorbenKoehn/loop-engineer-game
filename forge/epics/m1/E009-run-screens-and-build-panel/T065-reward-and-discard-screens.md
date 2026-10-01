---
id: T065
epic: E009
title: Reward and discard screens
summary: "PR-style reward screen with 3 diff cards, Skip (+6) and a credits receipt with interest, plus the discard screen when a gained item has no space."
keywords: ["ui", "rewards", "discard", "credits", "screens"]
type: task
status: backlog
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

- [ ] After a won fight the reward screen shows 3 diff-style cards, Skip (+6) and a receipt with an Interest line
- [ ] Picking dispatches pickReward and a duplicate shows "v1 → v2"
- [ ] The discard screen appears when an item has no space and dispatches discardItem

## Subtasks

- [ ] Reward cards
- [ ] Receipt
- [ ] Discard

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
