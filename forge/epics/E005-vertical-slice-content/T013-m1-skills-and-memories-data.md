---
id: T013
epic: E005
title: M1 skills and memories data
summary: "The 8 vertical-slice skills and 4 memories as DSL rule data with rarity, weight, unlock refs and strings."
keywords: ["content", "skills", "memories", "rules", "dsl"]
type: task
status: backlog
priority: p1
model: sonnet
size: S
depends_on: [T010]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T013: M1 skills and memories data

## Goal

Provide the M1 skill and memory pool as rule data so rewards, shop and Free Tier can offer them and the rule engine can execute them.

## Context

- Epic: [E005](EPIC.md)
- [Skills: Vertical slice skills (M1), Trigger semantics](../../../docs/game/content/skills.md#vertical-slice-skills-m1)
- [Memories table (M1 rows)](../../../docs/game/content/memories-lessons.md#memories)
- [Content model: DSL](../../../docs/architecture/content-model.md#the-dsl-rules--trigger---condition---effect)
- Code: `src/content/skills/`, `src/content/memories/`, `src/content/strings/en.ts`
- Out of scope: M2 skills and memories (E014); behaviour in combat (E007).

## Acceptance Criteria

- [ ] Test `M1 skills match the catalogue` asserts rarity, weight and rule shape for the 8 skills
- [ ] Test `M1 memories match the catalogue` asserts rarity, weight and rule shape for the 4 memories
- [ ] Generated lines are non-empty for all 12 items and Grep First renders the line from skills.md "Trigger semantics"
- [ ] Every skill and memory has name, line and flavour keys in en.ts

## Subtasks

- [ ] Skill defs
- [ ] Memory defs
- [ ] Strings

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
