---
id: T037
epic: E007
title: Armor trait, handler registry and Legacy Monolith
summary: "Armor layers with Edit-only full damage and break stuns, a typed handler registry, Legacy Monolith stage switches A/B/C and Undocumented Behavior adds."
keywords: ["boss", "armor", "handlers", "legacy-monolith", "stages"]
type: task
status: done
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

- [x] Armor(3, 50): Edit damage counts 100% and other damage 50% (floor) against the current layer, excess is discarded, and a break emits armorBroken and stuns 1500 ms
- [x] A typed handler registry exists in `src/sim/handlers`; content validation fails for an unknown handler id (test)
- [x] The Monolith switches stage A → B → C at its next intent after layer breaks, with the cycle index reset (test per stage)
- [x] Undocumented Behavior spawns in front of the Monolith with at most 2 alive
- [x] Test `boss fight resolves` runs p1b with a fixed loadout to a deterministic outcome pinned by hash

## Subtasks

- [x] Armor layers
- [x] Handler registry
- [x] Stage switching handler
- [x] Add spawning

## Notes

- Orchestrator 2026-10-01 (R064 F1): register the existing custom hooks `double_first_resolve`, `context_noise_cut`, `throttle_shorter` (src/sim/combat/mods/custom.ts) in the handler registry so validation accepts real content; update content-model.md handler description.

- 2026-10-01 (attempt 1): Real-content tests live in a new `src/run/boss.test.ts`, not `src/run/combat.test.ts` (499 lines; test_file_lines 500 would be breached). The registry also covers `web_ignores_outage`, `rot_no_slow` and `feedback_loop` so all M1 handler ids resolve (T013 Notes asked E007 for them); the two previously inert hooks are now implemented: Rot does not slow tools (`toolRate(sim, tool)`), and the rightmost tool pipes `ms` + pipeMs mods into the leftmost. Stage switch: after the boss's current intent, the stage whose layer range holds the layers left starts at cycle index 0 (`trait` event `stage`). armorBroken v = layer index (0 = first broken).

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
- 2026-10-01: AC1 verified: npx vitest run src/sim/combat/enemy/armor.test.ts (5 passed): Edit 30 -> layer 50->20, grep 15 -> 7 (floor), excess of an 80 hit discarded (sev and guard unchanged), damage -> armorBroken {remaining 2} -> statusOn stun 1500, enemyRate 0; Deadline bypasses armor
- 2026-10-01: AC2 verified: src/sim/handlers/index.ts (HANDLERS, HANDLER_IDS, HookId types hooks()); npx vitest run src/run/boss.test.ts: real M1 content validates [] with handlers: HANDLER_IDS, an unknown id yields "unregistered handler 'no_such_handler'"; handlers.test.ts pins the 7 ids (<= 10)
- 2026-10-01: AC3 verified: npx vitest run src/sim/handlers (6 passed): stage A opens a1@0, a2@1; first break -> a2 acts, stage b, b1@0; second break stays in B; third break -> stage c, c1@0
- 2026-10-01: AC4 verified: boss.test.ts p1b without tools: Undocumented Behavior spawns at 11000 and 22000 at index 0, the third at 33000 is dropped (index -1, max 2 alive)
- 2026-10-01: AC5 verified: boss.test.ts `boss fight resolves`: p1b, Terminal Purist run BOSS-0001, edit_file/sed/autocomplete/grep/cat v3 -> win, resolved, 40800 ms, 243 events, 3 breaks, log sha256 04b5412a...e9f6760
- 2026-10-01: npm run check exit 0 (763 tests, lint 0 errors); npm run build exit 0; npm run e2e exit 0 (12 passed); goldens unchanged; harness:diff production=189 total=524
- 2026-10-01: review requested
- 2026-10-01: done (R073)
