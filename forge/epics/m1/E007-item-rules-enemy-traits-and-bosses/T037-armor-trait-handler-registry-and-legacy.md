---
id: T037
epic: E007
title: Armor trait, handler registry and Legacy Monolith
summary: "Armor layers with Edit-only full damage and break stuns, a typed handler registry, Legacy Monolith stage switches A/B/C and Undocumented Behavior adds."
keywords: ["boss", "armor", "handlers", "legacy-monolith", "stages"]
type: task
status: in-progress
priority: p1
model: opus
size: M
depends_on: [T036, T014]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T037: Armor trait, handler registry and Legacy Monolith

## Goal

The phase-1 boss tests sustained Edit damage and context control under add noise, using the one custom mechanism the DSL allows.

## Context

- Epic: [E007](EPIC.md)
- [Phase 1: Boss Legacy Monolith](../../../../docs/game/content/phase-1-implement.md#boss-legacy-monolith-release)
- [Statuses: Armor trait](../../../../docs/game/systems/statuses.md#enemy-traits)
- [Content model: Custom handlers](../../../../docs/architecture/content-model.md#custom-handlers)
- Code: `src/sim/handlers/`, `src/sim/combat/traits.ts`
- Out of scope: Other bosses (E012), boss UI and layer-break juice (E011, E019).

## Acceptance Criteria

- [ ] Armor(3, 50): Edit damage counts 100% and other damage 50% (floor) against the current layer, excess is discarded, and a break emits armorBroken and stuns 1500 ms
- [ ] A typed handler registry exists in `src/sim/handlers`; content validation fails for an unknown handler id (test)
- [ ] The Monolith switches stage A → B → C at its next intent after layer breaks, with the cycle index reset (test per stage)
- [ ] Undocumented Behavior spawns in front of the Monolith with at most 2 alive
- [ ] Test `boss fight resolves` runs p1b with a fixed loadout to a deterministic outcome pinned by hash

## Subtasks

- [ ] Armor layers
- [ ] Handler registry
- [ ] Stage switching handler
- [ ] Add spawning

## Notes

- Orchestrator 2026-10-01 (R064 F1): register the existing custom hooks `double_first_resolve`, `context_noise_cut`, `throttle_shorter` (src/sim/combat/mods/custom.ts) in the handler registry so validation accepts real content; update content-model.md handler description.

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
