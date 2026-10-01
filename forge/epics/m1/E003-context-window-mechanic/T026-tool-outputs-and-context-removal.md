---
id: T026
epic: E003
title: Tool outputs and context removal
summary: "Tool output tokens added to signal after effects, negative output and removeCtx removing noise first and never below baseline, with tokens events in the documented order."
keywords: ["context", "outputs", "tokens", "removal", "summarize"]
type: task
status: done
priority: p1
model: opus
size: S
depends_on: [T025]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T026: Tool outputs and context removal

## Goal

Every tool call costs context, and removal tools buy it back, with the exact ordering the log documents.

## Context

- Epic: [E003](EPIC.md)
- [Context: Outputs](../../../../docs/game/systems/context.md#outputs)
- [Event log: Ordering, tokens payload](../../../../docs/architecture/event-log.md#ordering)
- [Tools: summarize](../../../../docs/game/content/tools.md#agent)
- Code: `src/sim/combat/context.ts`, `src/sim/combat/fire.ts`
- Out of scope: Overflow and compaction (later E003 tasks), output modifiers from items (E007).

## Acceptance Criteria

- [x] After a tool's effects (resolved with the zone before the activation), `max(0, output + mods)` is added to S with a tokens event of kind output (test)
- [x] Negative output and removeCtx remove from N first, then S, never below B (tokens kind removal)
- [x] Event order per activation is toolFired, effect events, tokens, zoneChanged (test)

## Subtasks

- [x] Output addition
- [x] Removal
- [x] Ordering test

## Notes

- Orchestrator 2026-10-01 (R041 F2): add a test that tool output tokens ignore the zone bonus ("never for tokens", context.md), and call `updateZone` after F changes.

- 2026-10-01 (attempt 1): `src/sim/combat/context/tokens.ts` holds `addOutput` (called in fire.ts after `applyEffects`) and `removeTokens` (also used by the `removeCtx` effect in effects.ts). The zone is recomputed once per activation, after the output: a `removeCtx` removal inside the effects does not emit `zoneChanged` on its own, so the log shows at most one `zoneChanged` per activation (AC3 order). No `tokens` event when the delta is 0 (output 0, nothing left to remove). `outputMods` is a parameter (default 0) for E007; for a negative base output it reduces the removal (`-(output + mods)`). CombatInput unchanged. Overflow is not checked yet (T028), so F can exceed W until then.
- Doc follow-ups (outside this task's allowed paths, not edited): event-log.md: add `src/sim/combat/context/**` to related_code, the zone index convention 0 Cold / 1 Focused / 2 Rot / 3 Overflow (R041 F1), the `tokens` convention (v is the actual change, no event on 0) and the once-per-activation zone update in "Ordering"; context.md "Outputs": `removeCtx` is a removal too, token amounts never take the zone %, and one activation counts as one change of F.
- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
- 2026-10-01: AC1 verified: npx vitest run src/sim/combat/context/tokens (10 passed): "adds max(0, output + mods) to S after the effects" (grep output 1 -> tokens {v 1, S 24, kind output} right after damage; output 3 + mods 2 -> 5, mods -9 -> 0 and no event) and "ignores the zone %" (Focused damage 7 / Cold damage 5, both add 5 tokens; R041 F2)
- 2026-10-01: AC2 verified: tokens.test.ts removal table (noise only -4; noise then signal -10; stops at B -13; nothing left -> no event), negative output -4 then -1 down to B, removeCtx v2 (14) on S 30/N 6/B 24 removes 12 (tokens kind removal)
- 2026-10-01: AC3 verified: tokens.test.ts "toolFired, effect events, tokens, zoneChanged" (B 41 of 60 -> output to F 42: damage with zone 1, tokens, zoneChanged 1->2); updateZone runs after F changes, once per activation (R041 F2 note). pipes.test.ts full-sequence expectation extended by the two new tokens events (documented order: tokens before pipe); UI sandbox tests unchanged and green
- 2026-10-01: npm run check exit 0 (435 tests, harness lint 0 errors); production diff 46 + 4 lines (tokens.ts, fire.ts, effects.ts)
- 2026-10-01: review requested
- 2026-10-01: done (R043)
