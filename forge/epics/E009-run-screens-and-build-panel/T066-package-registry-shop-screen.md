---
id: T066
epic: E009
title: Package Registry shop screen
summary: "Shop screen listing 5 offers as packages with price and sale tag, reroll with its cost, buy and sell actions and disabled reasons."
keywords: ["ui", "shop", "registry", "reroll", "screens"]
type: task
status: backlog
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
- [Screens: Package Registry row](../../../docs/game/ux/screens.md#other-screens)
- [Economy: Package Registry](../../../docs/game/systems/economy.md#package-registry-shop)
- Code: `src/ui/screens/shop.tsx`
- Out of scope: Prune (E012), drag-to-sell drop zone polish (E019).

## Acceptance Criteria

- [ ] The shop lists 5 offers as packages (e.g. `grep@2.0.0`) with price and sale tag; unaffordable offers are disabled with the reason
- [ ] Reroll shows its current cost; buy, reroll and sell dispatch and update credits
- [ ] Selling the last tool shows "An agent with no tools is a chatbot"

## Subtasks

- [ ] Offer list
- [ ] Actions
- [ ] Errors

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
