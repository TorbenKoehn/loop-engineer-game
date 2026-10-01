---
id: T043
epic: E004
title: "Rewards: credits, interest and 1-of-3 picks"
summary: "Fight payouts with rolls and interest, 1-of-3 reward cards by kind and rarity with pity and fallbacks, duplicate version merges, skip credits and the discard flow."
keywords: ["rewards", "credits", "interest", "rarity", "pity", "economy"]
type: task
status: done
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

- [x] Task, Critical Bug and Release payouts roll via `reward/<nodeId>`, and interest min(3, floor(held / 10)) is added before the payout (tests)
- [x] Three cards roll kind then rarity per source, without duplicates, excluding owned uniques, v3 tools and locked items
- [x] Pity and fallback: after 6 Task picks without a rare the next Task pick has one; an empty rarity falls back lower, then higher (tests)
- [x] A duplicate tool pick merges +1 version; skipReward gives +6 credits
- [x] Gaining an item with no free slot or stash enters discard mode, and discardItem resolves it

## Subtasks

- [x] Payout and interest
- [x] Card rolls
- [x] Pity
- [x] Merge, skip and discard

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.
- 2026-10-01: Decisions (attempt 1): payout and cards are granted on `continue` after a win
  (combatReview -> reward). One stream `reward/<nodeId>`: credits roll first, then per card
  kind (one draw of 100) and rarity. Pity forces card 0 to rare and tries rare in both kinds
  before falling back; the counter (`stats.taskPicksNoRare`) counts Task offers only.
  A kind with no offerable item falls back to the other kind; a pick may show < 3 cards.
  Gained items take a free slot of their kind, then the stash (no baseline check: T045).
  Discard refs are the gained item, any stash item or an equipped item of the same kind;
  others are rejected with `notOffered`. After a Release reward the run returns to `map`
  (phaseEnd: E012/E008). Critical Bug's extra Memory is elite memory (T046).
- 2026-10-01: Docs not edited (outside the delegated paths): run-state.md (related_code)
  should gain Pending `reward`/`discard`, `ItemRef`, `RewardCard`, `stats.taskPicksNoRare`.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
- 2026-10-01: AC1 verified: npx vitest run src/run/rewards.test.ts "payout and interest" (Task roll = int(fork(seed,'reward/'+id),10,14), interest 0/0/1/2/3/3 for held 0/9/10/25/30/99; CB 22..28; Release 40)
- 2026-10-01: AC2 verified: rewards.test.ts "reward cards" (3 distinct, unlocked, no owned skill incl. stash, no v3 tool, rarity matches content, 40 seeds)
- 2026-10-01: AC3 verified: rewards.test.ts "pity" (counter 6 -> rare on 40 seeds; sequential streak over all fight nodes) and fallback tests (common empty -> higher; uncommon empty -> lower first; Release rare tools empty -> uncommon)
- 2026-10-01: AC4 verified: rewards.test.ts "pick, merge and skip" (equipped grep v1->v2, stashed lint v2->v3, skip +6 -> map)
- 2026-10-01: AC5 verified: rewards.test.ts "discard" (full slots+stash -> mode discard; gained/stash/equipped refs resolve; wrong refs rejected)
- 2026-10-01: npm run check exit 0 (51 files, 407 tests; harness lint 0 errors). Production diff 289 lines (numstat, budget 300). combat.test.ts "continue" updated: win now leads to reward, skip returns to map.
- 2026-10-01: review requested
- 2026-10-01: done (R044)
