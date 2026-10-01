---
id: T030
epic: E003
title: Context-scaled effects and window modifiers
summary: "brute_force signal scaling, window modifiers applied at fight start with the 40 minimum, and Long-Context Training removing the Rot slowdown while noise still doubles."
keywords: ["context", "brute-force", "window", "long-context", "modifiers"]
type: task
status: backlog
priority: p2
model: opus
size: S
depends_on: [T025, T033]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T030: Context-scaled effects and window modifiers

## Goal

Items that bend the context rules work, so riding Rot or a larger window is a real build path.

## Context

- Epic: [E003](EPIC.md)
- [Tools: Special rules (brute_force)](../../../docs/game/content/tools.md#special-rules)
- [Memories: Long Context, rules](../../../docs/game/content/memories-lessons.md#memories)
- [Skills: Long-Context Training](../../../docs/game/content/skills.md#vertical-slice-skills-m1)
- [Content model: ModStat list](../../../docs/architecture/content-model.md#the-dsl-rules--trigger---condition---effect)
- Code: `src/sim/combat/context.ts`, `src/sim/combat/mods.ts`
- Out of scope: Memory Leak baseline growth (E012), system prompt effects other than window (E007).

## Acceptance Criteria

- [ ] Test `brute_force counts signal only`: W 60, S 45 gives base 6 + 7 = 13 at v1, unchanged by N
- [ ] Window modifiers (Long Context +40, senior -10) apply at fight start with a minimum of 40 (tests)
- [ ] Long-Context Training removes the Rot charge slowdown while incoming noise is still doubled (test)

## Subtasks

- [ ] perSignalTenth effect field
- [ ] Window mods at fight start
- [ ] Rot-slow override

## Notes

- 2026-10-01: ModStat has no entry for "Rot does not slow"; add one (e.g. `rotRatePct`) and update content-model.md in this task.
- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
