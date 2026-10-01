---
title: Economy
summary: Credits income and interest, reward rarity odds, Package Registry shop offers and prices, rerolls, selling, sales and version bumps, with tuning knobs.
keywords: [economy, credits, shop, prices, reroll, interest, rarity]
type: gdd
status: active
updated: 2026-10-01
related: [run-map.md, harness-loadout.md, meta-progression.md, ../content/tools.md]
---

# Economy

## Contents
- Income
- Reward picks (1 of 3)
- Package Registry (shop)
- Version bumps
- Economy targets (balance sim checks)
- Tuning knobs

One run currency: **Credits**. One meta currency: **Training Data** (see
[meta-progression](meta-progression.md)). All amounts are integers.

## Income

| Source | Amount |
|---|---|
| Run start | 10 |
| Task won | 10 + roll(0..4) |
| Critical Bug won | 22 + roll(0..6) |
| Release won | 40 |
| Skip a reward pick | +6 |
| Events | per event |

**Interest** (TFT): when a fight payout is granted, first add
`min(3, floor(creditsHeld / 10))`, computed on the credits held **before** the payout.
Shown as a separate line ("Interest +2"). `INTEREST_STEP = 10`, `INTEREST_CAP = 3`.

Rolls use `fork(runSeed, 'reward/' + nodeId)`.

## Reward picks (1 of 3)

Each of the 3 cards rolls kind then rarity, without duplicates within the pick and
excluding unique items already owned and tools owned at v3.

| Source | Kind | Common | Uncommon | Rare |
|---|---|---|---|---|
| Task | tool 70 / skill 30 | 60 | 35 | 5 |
| Critical Bug | tool 70 / skill 30 | 0 | 70 | 30 |
| Release | tool 50 / skill 50 | 0 | 0 | 100 |

Pity rule: after 6 Task picks with no rare offered, the next Task pick contains one rare
card. If a rarity bucket is empty, fall back to the next lower, then higher.

## Package Registry (shop)

Five offers, rolled on entry with `fork(runSeed, 'shop/' + nodeId)`:

| Slot | Kind | Common | Uncommon | Rare |
|---|---|---|---|---|
| 1–3 | tool | 55 | 35 | 10 |
| 4 | skill | 60 | 30 | 10 |
| 5 | memory | 50 | 35 | 15 |

One random offer is **on sale**: price × 70 / 100 (floor). Owned tools may appear (buying
merges +1 version) unless at v3.

### Prices

| Kind | Common | Uncommon | Rare |
|---|---|---|---|
| Tool | 12 | 18 | 26 |
| Skill | 14 | 20 | 28 |
| Memory | 18 | 26 | 34 |

Prices do not scale by phase (income does not either). Lint rule `budget-cuts` adds 25%.

### Reroll

Rerolls all 5 offers (sale is re-rolled too). Cost `2 + rerollsThisVisit`: 2, 3, 4…
Reroll RNG: `fork(runSeed, 'shop/' + nodeId + '/reroll/' + n)`.

### Selling

Any owned item (equipped or stashed, not the system prompt or lessons) sells for
`floor(basePrice × version / 2)` where skills and memories count as version 1. Starter
items count as common. Selling is only possible in a shop. Selling the last tool is
refused ("An agent with no tools is a chatbot").

### Service: Prune

Each shop also offers "Prune context" for 25 Credits (once per shop): permanently
reduce one equipped tool's weight by 1 (min 1). Tuning knob `PRUNE_PRICE = 25`.

## Version bumps

| Source | Cost |
|---|---|
| Buy a duplicate tool | the offer's price |
| Pick a duplicate as a reward | free |
| Idle Cycle upgrade | free, costs the heal |
| Events | per event |

## Economy targets (balance sim checks)

| Metric | Target |
|---|---|
| Credits earned per phase (no events) | 60–80 |
| Shop items bought per run | 6–10 |
| Share of runs that use interest (hold ≥ 10 at a payout) | ≥ 50% |
| Credits unspent at run end (median) | ≤ 20 |

## Tuning knobs

`START_CREDITS 10`, `TASK_CREDITS 10+0..4`, `ELITE_CREDITS 22+0..6`, `BOSS_CREDITS 40`,
`SKIP_CREDITS 6`, `INTEREST_STEP 10`, `INTEREST_CAP 3`, `SALE_PCT 70`, `REROLL_BASE 2`,
`REROLL_STEP 1`, `PRUNE_PRICE 25`, `PITY_PICKS 6`, rarity tables above.
