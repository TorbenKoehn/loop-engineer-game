---
id: E007
title: Item rules, enemy traits and bosses
summary: "Rule engine for skills, memories, prompts, lessons and harness traits; passive mods; tag breakpoints; enemy traits Split, Grow, Outage, Blocked, Armor; Yak Shave and Legacy Monolith (M1)."
keywords: ["rules", "dsl", "traits", "breakpoints", "boss", "handlers", "m1"]
type: epic
status: backlog
priority: p0
milestone: m1
updated: 2026-10-01
related: ["../../../../docs/architecture/content-model.md", "../../../../docs/architecture/sim-core.md", "../../../../docs/game/content/skills.md", "../../../../docs/game/systems/statuses.md", "../../../../docs/game/content/phase-1-implement.md", "../../../../docs/game/vertical-slice.md"]
---

# E007: Item rules, enemy traits and bosses

## Goal

M1 vertical slice. After this epic every M1 item, harness trait, system prompt, lesson, breakpoint, enemy trait, elite and boss behaves in combat exactly as the GDD states, executed by the trigger-condition-effect rule engine and a small typed handler registry.

## Scope

- Rule engine: triggers, conditions, effects ([DSL](../../../../docs/architecture/content-model.md))
- Passive stat modifiers (combat ModStats) with filters and why ids
- Harness traits Muscle Memory and Undo Stack, prompts senior/concise/step_by_step, lesson effects ([harnesses](../../../../docs/game/content/harnesses.md))
- Tag breakpoints POSIX, Refactor, Indexed, TDD
- Enemy traits Split, Grow, Outage, Blocked, Armor ([statuses and traits](../../../../docs/game/systems/statuses.md))
- Handler registry, Legacy Monolith stages, Yak Shave spawn rule
- Behaviour tests for all M1 tools, skills and memories over real content

## Out of Scope

- M2 traits (Clone, Flaky, Linked, Decoy, Elusive, Leak, Accelerate, Herd, Cascade, Hidden, StageTimer) (E012)
- Always Online and Orchestration breakpoints, run-level ModStats (E014)
- Sub-agents and Swarm/YOLO traits (E013)

## Definition of Done

- [ ] All E007 tasks done with approved reviews
- [ ] Each M1 tool, skill and memory has a passing behaviour test over its real definition
- [ ] p1x1 and p1b resolve deterministically with fixed loadouts (golden hashes)
- [ ] Handler count ≤ 10 and every handler has a unit test
