---
id: T044
epic: E004
title: "Package Registry shop: offers, buy, reroll, sell"
summary: "Shop with 5 rolled offers and one sale, buy with merges, rerolls with rising cost and forked RNG, and selling at half base price per version, without Prune in M1."
keywords: ["shop", "economy", "reroll", "sell", "prices", "registry"]
type: task
status: backlog
priority: p1
model: opus
size: M
depends_on: [T043]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T044: Package Registry shop: offers, buy, reroll, sell

## Goal

The shop turns credits into build decisions using the documented prices, odds and RNG paths.

## Context

- Epic: [E004](EPIC.md)
- [Economy: Package Registry, Prices, Reroll, Selling](../../../docs/game/systems/economy.md#package-registry-shop)
- [Run state: RNG fork paths (shop)](../../../docs/architecture/run-state.md#rng-fork-paths)
- [Vertical slice: Prune absent](../../../docs/game/vertical-slice.md#slice-specific-deviations)
- Code: `src/run/shop.ts`
- Out of scope: Prune service (E012), shop UI (E009).

## Acceptance Criteria

- [ ] Entering a shop rolls 3 tool, 1 skill and 1 memory offer with the rarity tables and one sale at 70% (floor) via `shop/<nodeId>`
- [ ] buy deducts the price, fails with insufficientCredits when short, and merges duplicate tools; v3 tools are never offered
- [ ] reroll costs 2 + rerolls this visit and uses `shop/<nodeId>/reroll/<n>`
- [ ] sell pays floor(basePrice x version / 2) with starters as common, refuses the last tool, and is legal only in a shop
- [ ] No prune action is legal in M1

## Subtasks

- [ ] Offer rolls and sale
- [ ] Buy
- [ ] Reroll
- [ ] Sell

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
