---
id: T044
epic: E004
title: "Package Registry shop: offers, buy, reroll, sell"
summary: "Shop with 5 rolled offers and one sale, buy with merges, rerolls with rising cost and forked RNG, and selling at half base price per version, without Prune in M1."
keywords: ["shop", "economy", "reroll", "sell", "prices", "registry"]
type: task
status: done
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
- [Economy: Package Registry, Prices, Reroll, Selling](../../../../docs/game/systems/economy.md#package-registry-shop)
- [Run state: RNG fork paths (shop)](../../../../docs/architecture/run-state.md#rng-fork-paths)
- [Vertical slice: Prune absent](../../../../docs/game/vertical-slice.md#slice-specific-deviations)
- Code: `src/run/shop.ts`
- Out of scope: Prune service (E012), shop UI (E009).

## Acceptance Criteria

- [x] Entering a shop rolls 3 tool, 1 skill and 1 memory offer with the rarity tables and one sale at 70% (floor) via `shop/<nodeId>`
- [x] buy deducts the price, fails with insufficientCredits when short, and merges duplicate tools; v3 tools are never offered
- [x] reroll costs 2 + rerolls this visit and uses `shop/<nodeId>/reroll/<n>`
- [x] sell pays floor(basePrice x version / 2) with starters as common, refuses the last tool, and is legal only in a shop
- [x] No prune action is legal in M1

## Subtasks

- [x] Offer rolls and sale
- [x] Buy
- [x] Reroll
- [x] Sell

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.
- 2026-10-01: Decisions: reroll fork index `n` is 1-based (first reroll uses `reroll/1`). "Last tool" = selling would leave no equipped tool (`lastTool` error), which also covers the only owned tool. Offers within one roll are distinct; owned skills and memories are unique and never offered. A buy with no space enters discard mode and returns to the shop (`resume` on the discard pending). `leaveShop` added as the shop exit. `prune` is not in the Action union (apply returns unknownAction). Starters = harness `tools` + `skills` ids; all M1 starters are common already, so the rule is proven via `basePrice(item, starters)`.
- 2026-10-01: docs/architecture/run-state.md unchanged: its Action union already lists the shop actions; `resume` and `ShopPending` are below its level of detail. Production diff 287 lines.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
- 2026-10-01: AC1 verified: npx vitest run src/run/shop ("rolls 3 tools, 1 skill and 1 memory from shop/<nodeId> with one sale at 70% (floor)", "follows the rarity tables" over 300 seeds)
- 2026-10-01: AC2 verified: shop.test.ts buy suite (price deducted, insufficientCredits unchanged state, duplicate merge to v2, discard returns to shop) and "never v3 tools, owned skills or memories"
- 2026-10-01: AC3 verified: shop.test.ts "costs 2 + rerolls this visit and rolls from shop/<nodeId>/reroll/<n>" (2, 3, 4; pending equals rollShop with that fork) and insufficientCredits case
- 2026-10-01: AC4 verified: shop.test.ts sell suite (27/9/12/10/17 prices, starters common via basePrice, lastTool refused and not listed, wrongMode on the map)
- 2026-10-01: AC5 verified: shop.test.ts "lists no prune action and rejects one" (legal kinds buy/reroll/sell/leaveShop; prune -> unknownAction)
- 2026-10-01: mutation check: 7 hand mutations of shop.ts (sale %, reroll base, last tool, starter rarity, reroll path, v3 exclusion, sold flag) each fail a test
- 2026-10-01: npm run check passed (tsc, biome, vitest, harness:check 0 errors)
- 2026-10-01: review requested
- 2026-10-01: done (R046)
