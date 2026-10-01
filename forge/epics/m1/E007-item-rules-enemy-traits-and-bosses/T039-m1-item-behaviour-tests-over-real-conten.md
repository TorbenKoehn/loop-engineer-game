---
id: T039
epic: E007
title: M1 item behaviour tests over real content
summary: "One behaviour test per M1 tool (v1 and v3), skill and memory using the real content definitions, with every mismatch fixed in sim or content."
keywords: ["tests", "items", "tools", "skills", "memories", "content"]
type: task
status: backlog
priority: p1
model: opus
size: M
depends_on: [T034, T035, T030, T012, T013]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T039: M1 item behaviour tests over real content

## Goal

Prove every slice item does what its card says in an actual fight, closing the gap between data, rule engine and GDD before balance work starts.

## Context

- Epic: [E007](EPIC.md)
- [Tool catalogue (M1 rows), Special rules](../../../../docs/game/content/tools.md)
- [Skills: M1 skills](../../../../docs/game/content/skills.md#vertical-slice-skills-m1)
- [Memories: M1 rows](../../../../docs/game/content/memories-lessons.md#memories)
- [Testing: Rules for agents writing tests](../../../../docs/architecture/testing.md#rules-for-agents-writing-tests)
- Code: `tests/items/` (outside src/sim so tests may import content data)
- Out of scope: Balance changes to numbers (E010), M2 items.

## Acceptance Criteria

- [ ] Each of the 12 M1 tools has a test using its real definition that checks its documented effect at v1 and v3
- [ ] Each of the 8 M1 skills and 4 memories has a test checking its documented effect in a fight
- [ ] Every mismatch found is fixed in sim or content and listed in the Log
- [ ] `npm run test:coverage` reports src/sim line coverage ≥ 95%

## Subtasks

- [ ] Tool tests
- [ ] Skill tests
- [ ] Memory tests
- [ ] Fixes

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
