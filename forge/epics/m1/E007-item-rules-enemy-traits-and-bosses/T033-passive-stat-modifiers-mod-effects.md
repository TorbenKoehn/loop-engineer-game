---
id: T033
epic: E007
title: Passive stat modifiers (mod effects)
summary: "Passive mod effects for the combat ModStats (rate, dmgPct, dmgFlat, output, window, pipeMs, focusPct, noiseBlock, duration and damage-taken mods) with filters and why ids."
keywords: ["modifiers", "mod-stats", "passives", "damage-formula", "sim"]
type: task
status: done
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

- [x] Every combat ModStat has a test showing its effect, including filters by tag, tool and weight
- [x] Flat damage adds before percentages and each applied modifier appears in the damage why list (e.g. `skill:inline_suggestions`)
- [x] throttleDurPct, stunDurPct and noiseBlock feed the status and noise code paths (tests)
- [x] Mods are collected once at fight start from harness trait, prompt, skills, memories and lessons in slot order

## Subtasks

- [x] Mod collection
- [x] Hook points per stat
- [x] why ids
- [x] R054 F2 (one zone update per activation) and F3 (`every.ms` multiple of 50, rule 2)
- [x] Docs: R054 F1 (event-log Ordering, sim-core Sim.rules/mods + related_code, combat.md tick order); content-model rule 2 line

## Notes

- Orchestrator 2026-10-01 (R054): F2 - a compaction rule that removes context can log two zoneChanged in one activation; keep at most one. F3 - add a content validation rule that `every` intervals are multiples of 50 ms (src/content/validation).

- Scope extension (orchestrator 2026-10-01): src/run/combat.test.ts p1-boss test now searches s0..s199 for the first shipped run (fixed s0-s9 had none once mods went live; win rate is E010 balance); content-model.md rule-2 line for `every`.
- CombatInput change: new optional `trait?: HarnessTrait` (rules collected first, kind `trait`); T034 wires it in src/run.
- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
- 2026-10-01: implemented mods in src/sim/combat/mods/ (14 tests), F2 fix in fire.ts (+test), F3 rule in validation/numbers.ts (+test); tsc and biome green, src/sim and src/content tests green
- 2026-10-01: blocked - npm run check fails only on src/run/combat.test.ts seed-dependent p1-boss test (balance shift from live mods); see Notes
- 2026-10-01: unblocked by orchestrator (run test seed search, content-model.md allowed); docs R054 F1 done (event-log Ordering + why ids, sim-core RulesRt/ModRt/trait + related_code, combat.md tick order and formula)
- 2026-10-01: AC1 verified: npx vitest run src/sim/combat/mods (14 passed) - rate (maxWeight), dmgPct (tag, family), dmgFlat (tool), output (tool), pipeMs, window, focusPct, noiseBlock, throttleDurPct, stunDurPct, dmgTakenPct
- 2026-10-01: AC2 verified: mods.test "dmgFlat adds before percentages" (v 14 not 12, why ['skill:m','zone:focused','skill:m']); dmgPct/focusPct/dmgTakenPct tests assert why ids
- 2026-10-01: AC3 verified: mods.test throttleDurPct (applyStatus on tool/agent, not enemy), stunDurPct (enemy stun verb 1500 ms, min 50), noiseBlock (enemy noise verb blocked 5 then 2)
- 2026-10-01: AC4 verified: mods.test "collects once at fight start" ids [trait:t, prompt:p, skill:s, memory:mem, lesson:l], W fixed at 65
- 2026-10-01: R054 F2 verified: triggers.test "one zone update per activation"; F3: validation/numbers.test.ts (2 passed)
- 2026-10-01: npm run check green (66 files, 593 tests); production diff ~260 lines
- 2026-10-01: review requested
- 2026-10-01: done (R058)
