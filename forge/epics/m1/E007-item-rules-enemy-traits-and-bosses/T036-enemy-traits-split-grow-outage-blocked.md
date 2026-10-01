---
id: T036
epic: E007
title: Enemy traits Split, Grow, Outage, Blocked
summary: "Enemy traits Split (spawn children at index), Grow (timed Severity and damage growth), Outage (disabled tag effects) and Blocked (immune while others live), with trait events."
keywords: ["traits", "enemies", "split", "grow", "outage", "blocked"]
type: task
status: in-progress
priority: p1
model: opus
size: M
depends_on: [T021, T023]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T036: Enemy traits Split, Grow, Outage, Blocked

## Goal

Each phase-1 enemy teaches its mechanic through its trait, implemented exactly as the trait catalogue states.

## Context

- Epic: [E007](EPIC.md)
- [Statuses: Enemy traits (Split, Grow, Outage, Blocked)](../../../../docs/game/systems/statuses.md#enemy-traits)
- [Combat: Tick order steps 2 and 8](../../../../docs/game/systems/combat.md#tick-order)
- [Phase 1: Enemies](../../../../docs/game/content/phase-1-implement.md#enemies)
- Code: `src/sim/combat/traits.ts`
- Out of scope: Armor and bosses (next tasks), M2 traits (E012), Cache and Always Online Outage exceptions beyond a mod hook.

## Acceptance Criteria

- [ ] Split(2, 50): resolving Dependency Hell spawns 2 Transitive Deps at its index at 50% of the parent's max Severity (spawn reason split)
- [ ] Grow(4000, 6, 1): every 4000 ms Scope Creep gains +6 max and current Severity and +1 attack, with trait events
- [ ] Outage(Web): Web tools fire and add output but their effects do nothing while the enemy lives
- [ ] Blocked: 0 damage while any non-Blocked enemy lives; Deadline damage still applies
- [ ] Timed traits tick in step 2 of the tick order (test)

## Subtasks

- [ ] Trait state
- [ ] On-death traits
- [ ] Timed traits
- [ ] Damage gates

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
