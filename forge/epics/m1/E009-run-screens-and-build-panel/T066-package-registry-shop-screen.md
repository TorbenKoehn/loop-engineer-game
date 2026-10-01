---
id: T066
epic: E009
title: Package Registry shop screen
summary: "Shop screen listing 5 offers as packages with price and sale tag, reroll with its cost, buy and sell actions and disabled reasons."
keywords: ["ui", "shop", "registry", "reroll", "screens"]
type: task
status: done
priority: p2
model: sonnet
size: S
depends_on: [T064, T044]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T066: Package Registry shop screen

## Goal

The shop presents offers and costs clearly so spending and interest become a real decision.

## Context

- Epic: [E009](EPIC.md)
- [Screens: Package Registry row](../../../../docs/game/ux/screens.md#other-screens)
- [Economy: Package Registry](../../../../docs/game/systems/economy.md#package-registry-shop)
- Code: `src/ui/screens/shop.tsx`
- Out of scope: Prune (E012), drag-to-sell drop zone polish (E019).

## Acceptance Criteria

- [x] The shop lists 5 offers as packages (e.g. `grep@2.0.0`) with price and sale tag; unaffordable offers are disabled with the reason
- [x] Reroll shows its current cost; buy, reroll and sell dispatch and update credits
- [x] Selling the last tool shows "An agent with no tools is a chatbot"

## Subtasks

- [x] Offer list
- [x] Actions
- [x] Errors

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (sonnet)
- 2026-10-01: AC1 verified: npx playwright test shop (5 offers as name@v.0.0 with price, one SALE tag; unaffordable disabled with "Need N more Credits")
- 2026-10-01: AC2 verified: e2e reroll shows "Reroll ($ 2)" then "($ 3)", credits drop by cost; buy and sell change credits
- 2026-10-01: AC3 verified: e2e selling the last tool shows "An agent with no tools is a chatbot"
- 2026-10-01: npm run check exit 0; npm run build ok; npx playwright test 15 passed
- 2026-10-01: review requested
- 2026-10-01: R070 changes-requested
- 2026-10-01: addressed R070 (2 findings): rerollCost exported from run/shop.ts and used in shop.tsx; new deterministic e2e rerolls until an offer is disabled and asserts the "Need N more Credits" reason; check/build/e2e (16 passed) green
- 2026-10-01: review requested
- 2026-10-01: done (R071)
