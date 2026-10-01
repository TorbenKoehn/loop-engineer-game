---
id: T013
epic: E005
title: M1 skills and memories data
summary: "The 8 vertical-slice skills and 4 memories as DSL rule data with rarity, weight, unlock refs and strings."
keywords: ["content", "skills", "memories", "rules", "dsl"]
type: task
status: done
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
- [Skills: Vertical slice skills (M1), Trigger semantics](../../../../docs/game/content/skills.md#vertical-slice-skills-m1)
- [Memories table (M1 rows)](../../../../docs/game/content/memories-lessons.md#memories)
- [Content model: DSL](../../../../docs/architecture/content-model.md#the-dsl-rules--trigger---condition---effect)
- Code: `src/content/skills/`, `src/content/memories/`, `src/content/strings/en.ts`
- Out of scope: M2 skills and memories (E014); behaviour in combat (E007).

## Acceptance Criteria

- [x] Test `M1 skills match the catalogue` asserts rarity, weight and rule shape for the 8 skills
- [x] Test `M1 memories match the catalogue` asserts rarity, weight and rule shape for the 4 memories
- [x] Generated lines are non-empty for all 12 items and Grep First renders the line from skills.md "Trigger semantics"
- [x] Every skill and memory has name, line and flavour keys in en.ts

## Subtasks

- [x] Skill defs
- [x] Memory defs
- [x] Strings

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.
- 2026-10-01: Lockfile Slow gap: reused ModStat throttleDurPct (its stat string already reads "Throttle and Slow duration on your tools"); no new ModStat or key.
- 2026-10-01: Custom handlers rot_no_slow, feedback_loop, web_ignores_outage need E007 implementations in src/sim/handlers. Only loop_theory is a new unlock node id (feedback_loop); starter skills are base. E007 must interpret Cache's oncePerFight on a passive dmgPct as "first Web activation each fight". Cache "first Web activation" is modelled as a passive dmgPct +100 with oncePerFight.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (sonnet)
- 2026-10-01: AC1 verified: npx vitest run src/content/skills (test "M1 skills match the catalogue" passed)
- 2026-10-01: AC2 verified: same file, test "M1 memories match the catalogue" passed
- 2026-10-01: AC3 verified: test "generates non-empty lines for all 12 items; Grep First matches skills.md" passed
- 2026-10-01: AC4 verified: test "every skill and memory has name and flavour keys in en" passed; lines are generated (describeRule) as for tools, so there is no stored line key
- 2026-10-01: npm run check green (tsc, biome, vitest, harness:check)
- 2026-10-01: review requested
- 2026-10-01: addressed R022 (F1, F2): unix_philosophy and inline_suggestions are now base; only feedback_loop is gated (loop_theory)
- 2026-10-01: done (R024)
