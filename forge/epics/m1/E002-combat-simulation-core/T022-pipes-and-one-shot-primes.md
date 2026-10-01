---
id: T022
epic: E002
title: Pipes and one-shot primes
summary: "Pipe charge transfer to the right neighbour with same-step firing and chain steps, the was-piped flag, and prime effects consumed on the next matching activation."
keywords: ["sim", "pipes", "primes", "tool-order", "chain"]
type: task
status: done
priority: p1
model: opus
size: M
depends_on: [T019, T020]
updated: 2026-10-01
related: ["EPIC.md"]
---

# T022: Pipes and one-shot primes

## Goal

Tool order matters: pipes push charge right and primes buff the next matching activation, both visible in the log.

## Context

- Epic: [E002](EPIC.md)
- [Combat: Pipes, Tick order step 4](../../../../docs/game/systems/combat.md#pipes)
- [Statuses: Primed](../../../../docs/game/systems/statuses.md#primed-one-shot-modifier)
- [Event log: pipe, prime, primeUsed, Ordering](../../../../docs/architecture/event-log.md#ordering)
- Code: `src/sim/combat/pipes.ts`, `src/sim/combat/fire.ts`
- Out of scope: Pipe bonuses from skills and breakpoints (E007), Feedback Loop wrap (E007).

## Acceptance Criteria

- [x] Test `pipe fills right neighbour` adds P x 100 progress capped at full, and a filled neighbour fires in the same step
- [x] Pipes do nothing to Throttled or Stunned tools and never wrap around (tests)
- [x] A tool counts as "was piped" until its own next activation (test)
- [x] pipe events carry the 1-based chain step within 1000 ms
- [x] Test `primes add and are consumed together` with prime and primeUsed events and why id `prime:<tool>`

## Subtasks

- [x] Pipe transfer and same-step fire
- [x] Chain step tracking
- [x] Prime storage and consumption

## Notes

- 2026-10-01: Meets the Definition of Ready; held in backlog because of wip_ready (8). Promote when all depends_on are done.
- 2026-10-01: Code in `src/sim/combat/order/` (pipes.ts, primes.ts) because `src/sim/combat` is near dir_files. `fire.ts`: toolFired -> primeUsed* -> effects -> clear `piped` -> pipe. No CombatInput/EncounterSetup change; `applyEffects` gains an optional `mods` argument and `ToolRt` gains `piped` and `primes` (as in sim-core.md), `Sim` gains `pipeChain`.
- 2026-10-01: Interpretations (GDD is silent, please confirm in review):
  - Chain step: one chain per fight window. A pipe less than 1000 ms after the chain's first pipe gets step + 1, otherwise starts at 1 (matches juice "reset after 1 s" and the `pipe_chain` achievement "5 pipes within 1000 ms").
  - Pipe `v` is the nominal P ms, also when capped (same as the `charge` event). Agent Stun also blocks pipes (it stops all tools, as in charge.ts).
  - A prime binds at creation to the matching tool with the soonest predicted activation at current rates (ties: leftmost; halted tools last), so `prime` is t -> t and the chip sits on one tool. `count: n` primes the n soonest matching tools, one each. No matching tool: no prime, no event. `family` in a filter never excludes a tool. Logged filter: `tag:Edit`, `any` when empty.
  - Primes are consumed at the start of the activation (primeUsed src = priming tool, dst = consuming tool) and apply to every dmg/guard/heal amount of it; a prime made during an activation waits for the next one. event-log.md "Ordering" does not list primeUsed yet (docs outside this task's allowed paths).
- 2026-10-01: Was blocked: `src/ui/sandbox/fold.test.ts` pinned `trust: 60` for terminal_purist vs p1e1; with pipes the sim ends at trust 64 (same endT, two fewer enemy hits). Scope extension by the orchestrator: that test may be edited in this task. Its `view.end` assertion now derives outcome, reason, Trust and endT from the `resolveCombat` result for the same input (intent of T098 AC4), so sim rule changes no longer break it.

## Log

- 2026-10-01: created
- 2026-10-01: started attempt 1 (opus)
- 2026-10-01: AC1 verified: npx vitest run src/sim/combat/order (12 passed) - pipes.test.ts "pipe fills right neighbour" (+500 ms x 100; capped at full, t1 fires in the same fireTools step right after the pipe event)
- 2026-10-01: AC2 verified: pipes.test.ts "does nothing to a tool under throttle/stun on the tool, stun on the agent" and "never wraps around from the rightmost tool"
- 2026-10-01: AC3 verified: pipes.test.ts "a tool counts as was piped until its own next activation"
- 2026-10-01: AC4 verified: pipes.test.ts "pipe events carry the 1-based chain step within 1000 ms" (steps 1,2,3 in one step, 4 at +950 ms, restart 1 at +1000 ms)
- 2026-10-01: AC5 verified: primes.test.ts "primes add and are consumed together" (prime x2, primeUsed x2, damage pct 50, why [prime:read_file, prime:grep], next activation unprimed)
- 2026-10-01: npm run check: tsc and biome green; vitest 334/335, only src/ui/sandbox/fold.test.ts pinned trust fails (see Blocked by)
- 2026-10-01: blocked: pinned UI sandbox test value outside allowed paths
- 2026-10-01: unblocked by orchestrator scope extension; fold.test.ts end assertion derived from the sim result
- 2026-10-01: npm run check: all steps passed (vitest 335/335, harness lint 0 errors)
- 2026-10-01: review requested
- 2026-10-01: done (R035)
