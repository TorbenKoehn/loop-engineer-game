---
id: T043
epic: E004
title: "Rewards: credits, interest and 1-of-3 picks"
summary: "Fight payouts with rolls and interest, 1-of-3 reward cards by kind and rarity with pity and fallbacks, duplicate version merges, skip credits and the discard flow."
keywords: ["rewards", "credits", "interest", "rarity", "pity", "economy"]
type: task
status: in-progress
priority: p1
model: opus
size: M
depends_on: [T042, T012, T013]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T043: Rewards: credits, interest and 1-of-3 picks

## Goal

Winning a fight pays out and offers a meaningful pick, with exactly the odds and rules of the economy GDD.

## Context

- Epic: [E004](EPIC.md)
- [Economy: Income, Reward picks](../../../../docs/game/systems/economy.md#income)
- [Run and map: Rewards per node](../../../../docs/game/systems/run-map.md#rewards-per-node)
- [Loadout: Versions, Slots and stash](../../../../docs/game/systems/harness-loadout.md#versions)
- Code: `src/run/rewards.ts`
- Out of scope: Shop (next task), elite memory (Idle Cycle task), reward UI (E009).

## Acceptance Criteria

- [ ] Task, Critical Bug and Release payouts roll via `reward/<nodeId>`, and interest min(3, floor(held / 10)) is added before the payout (tests)
- [ ] Three cards roll kind then rarity per source, without duplicates, excluding owned uniques, v3 tools and locked items
- [ ] Pity and fallback: after 6 Task picks without a rare the next Task pick has one; an empty rarity falls back lower, then higher (tests)
- [ ] A duplicate tool pick merges +1 version; skipReward gives +6 credits
- [ ] Gaining an item with no free slot or stash enters discard mode, and discardItem resolves it

## Subtasks

- [ ] Payout and interest
- [ ] Card rolls
- [ ] Pity
- [ ] Merge, skip and discard

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
