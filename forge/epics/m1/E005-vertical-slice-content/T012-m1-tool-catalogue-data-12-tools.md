---
id: T012
epic: E005
title: M1 tool catalogue data (12 tools)
summary: "The 12 vertical-slice tools as typed data with tags, rarity, weight, cooldown, output, pipe, target, v1/v2/v3 effects, unlock refs, names and flavour lines."
keywords: ["content", "tools", "catalogue", "cooldowns", "versions"]
type: task
status: in-progress
priority: p1
model: opus
size: M
depends_on: [T010]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T012: M1 tool catalogue data (12 tools)

## Goal

Provide every M1 tool exactly as the catalogue states so combat, rewards and the shop work with real numbers.

## Context

- Epic: [E005](EPIC.md)
- [Tool catalogue: tables, Special rules, Flavour lines (M1 tools)](../../../../docs/game/content/tools.md)
- [Vertical slice: In scope (Tools row)](../../../../docs/game/vertical-slice.md#in-scope)
- [Content model: DSL](../../../../docs/architecture/content-model.md#the-dsl-rules--trigger---condition---effect)
- Code: `src/content/tools/`, `src/content/strings/en.ts`
- Out of scope: The other 24 tools (E014); tool behaviour tests in the sim (E007).

## Acceptance Criteria

- [ ] Test `M1 tools match the catalogue` asserts tags, rarity, weight, cooldownMs, output, pipeMs, target and v1/v2/v3 values for all 12 tools
- [ ] `brute_force` carries a non-base unlock ref and the other 11 tools are `base`
- [ ] read_file's prime, retry_with_backoff's Throttle clear and Haste, brute_force's signal scaling and summarize's removal are DSL effects or registered handler ids, never free code in data
- [ ] Flavour strings equal tools.md "Flavour lines (M1 tools)" (test)

## Subtasks

- [ ] Search and Edit tools
- [ ] Test, Shell, Web and Agent tools
- [ ] Names, lines and flavour strings

## Notes

- 2026-10-01: The DSL has no "clear status" effect for retry_with_backoff; use a `custom` handler id (e.g. `clearThrottle`) or extend Effect and update content-model.md, and record the choice.
- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
