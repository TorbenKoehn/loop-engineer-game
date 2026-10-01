---
id: T033
epic: E007
title: Passive stat modifiers (mod effects)
summary: "Passive mod effects for the combat ModStats (rate, dmgPct, dmgFlat, output, window, pipeMs, focusPct, noiseBlock, duration and damage-taken mods) with filters and why ids."
keywords: ["modifiers", "mod-stats", "passives", "damage-formula", "sim"]
type: task
status: backlog
priority: p0
model: opus
size: M
depends_on: [T032]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T033: Passive stat modifiers (mod effects)

## Goal

Always-on item effects change the sim numbers through one mechanism, and each applied modifier is named in the log so tooltips can explain it.

## Context

- Epic: [E007](EPIC.md)
- [Content model: ModStat list](../../../../docs/architecture/content-model.md#the-dsl-rules--trigger---condition---effect)
- [Combat: Damage formula (flat before percent)](../../../../docs/game/systems/combat.md#damage-formula)
- [Statuses: Duration modifiers rule](../../../../docs/game/systems/statuses.md#the-six-statuses)
- Code: `src/sim/combat/mods.ts`
- Out of scope: Run-level ModStats credits, slots.tool, slots.memory, rerollCost, healPct (E014).

## Acceptance Criteria

- [ ] Every combat ModStat has a test showing its effect, including filters by tag, tool and weight
- [ ] Flat damage adds before percentages and each applied modifier appears in the damage why list (e.g. `skill:inline_suggestions`)
- [ ] throttleDurPct, stunDurPct and noiseBlock feed the status and noise code paths (tests)
- [ ] Mods are collected once at fight start from harness trait, prompt, skills, memories and lessons in slot order

## Subtasks

- [ ] Mod collection
- [ ] Hook points per stat
- [ ] why ids

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
