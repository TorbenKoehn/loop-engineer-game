---
title: Simulation core
summary: The pure deterministic combat sim - API, entities, integer-ms tick model, integer maths, seeded forkable RNG, determinism rules and the fast-forward optimisation.
keywords: [sim, determinism, tick, rng, integer-math, combat, api]
type: doc
status: active
updated: 2026-10-01
related_code: [src/sim/rng.ts, src/sim/int.ts, src/sim/combat/types.ts, src/sim/combat/state.ts, src/sim/combat/resolve.ts, src/sim/combat/deadline.ts, src/sim/combat/end.ts, src/sim/combat/order/**, src/sim/combat/context/ctx.ts, src/sim/combat/rules/**, src/sim/combat/mods/**]
related: [event-log.md, overview.md, content-model.md, ../game/systems/combat.md, ../game/systems/context.md, adr/adr-002-deterministic-sim.md]
---

# Simulation core

## Contents
- API
- Entities
- Tick model
- Integer maths
- RNG
- Determinism rules (checked in review and tests)

Game rules live in the GDD ([combat](../game/systems/combat.md),
[context](../game/systems/context.md), [statuses](../game/systems/statuses.md)). This
doc defines how `src/sim` implements them.

## API

```ts
export interface CombatInput {
  seed: Seed;                    // forked by the run: 'combat/' + nodeId
  agent: AgentSetup;             // resolved harness stats, trust, maxTrust, tools in slot order
  skills: readonly SkillDef[];   // resolved defs (sim never imports content data)
  memories: readonly MemoryDef[];
  lessons: readonly LessonDef[];
  prompt: SystemPromptDef;
  trait?: HarnessTrait;          // harness trait rules, first in slot order
  policy: 70 | 80 | 90 | 0;      // 0 = never
  encounter: EncounterSetup;     // enemies (front to back), spawnDefs?, deadlineMs, phase, loop
  modifiers: readonly FightModifier[]; // next-fight event modifiers, lint rules
}
export interface CombatResult {
  outcome: 'win' | 'loss';
  reason: 'resolved' | 'trust' | 'timeout';
  endT: number;                  // ms
  agentAfter: { trust: number; maxTrust: number; usedOncePerRun: readonly string[] };
  events: readonly CombatEvent[];// see event-log.md; empty when opts.log === false
  stats: CombatStats;            // damage by source, time per zone, compactions
}
export function resolveCombat(input: CombatInput, opts?: { log?: boolean }): CombatResult;
```

`resolveCombat` is a pure function: same input, same result, byte for byte.

`EncounterSetup.spawnDefs?: readonly EnemyDef[]` lists defs that intents may spawn without
being in the starting line (e.g. Side Quest). The sim resolves spawn ids against
`enemies` plus `spawnDefs`.

## Entities

| Entity | Key fields |
|---|---|
| `Agent` | `trust`, `maxTrust`, `guard`, `statuses`, `tools: ToolRt[]`, `ctx: Ctx`, `flags` (once-per-fight/run) |
| `ToolRt` | `slot`, `def`, `version`, `rate` (harness speed + matching `rate` mods), `progress` (ms × 100), `statuses`, `piped`, `primes`; each status and prime keeps the `seq` of the event that last applied it (auto-compaction loses the highest) |
| `Ctx` | `W`, `B` (readonly), `S`, `N`, `zone`, `coldPenalty` (readonly, % from model accuracy: high 15, normal 25, low 35), `block` (blocker budget left this fight, from `noiseBlock` passives), `focus` (`focusPct` mods); `W` includes `window` mods; `createCtx` applies `startSignal`/`startNoise` (through blockers); `policy` (readonly, planned compaction %, 0 = never), `lastCompactT` (t of the last compaction of any kind, absent before the first: planned lockout) |
| `EnemyRt` | `uid` (monotonic spawn id), `def`, `sev`, `maxSev`, `guard`, `armor`, `statuses`, `intentIx`, `progress`, `traitState` |
| `SummonRt` | `uid`, `sourceSlot`, `value`, `bornT`, `lifeMs`, `nextHitT` |
| `Sim` | `t`, `seq`, `rng`, `agent`, `enemies` (array, index 0 = front), `summons`, `events`, `deadline`, `rules`, `mods` |
| `RulesRt` | `list` (item rules in slot order: trait, prompt, skills, memories, lessons; `hits`, `lastT` each), `pending` triggers, `usedOncePerRun` |
| `ModRt` | passive `mod` effects collected once at fight start from `rules.list`: why id `<kind>:<def id>`, `stat`, `v`, `filter`, owning rule (conds). Fight-start stats (`window`, `noiseBlock`, `focusPct`, `rate`) check only the filter; the others check the rule's conds where they apply (damage mods once per activation, which counts for `oncePerFight`) |

All entity state is plain data (no classes with hidden state), so a snapshot is
`structuredClone`-able and comparable in tests.

## Tick model

- Time is integer ms. `TICK_MS = 50`. The loop runs the 8 steps of the
  [combat tick order](../game/systems/combat.md#tick-order) per tick.
- Progress unit: `ms × 100`, so `progress += TICK_MS × rate` with `rate` in percent stays
  an integer. A tool fires when `progress ≥ cooldownMs × 100`.
- Iteration order is always array order: tools by slot, enemies by line index, summons by
  `uid`, statuses by application `seq`.
- Each step is a small function `(sim) => void` over a mutable working copy that is
  created from the input at fight start. Mutation is local to `resolveCombat`.

### Fast-forward (optimisation)

Between "interesting" moments nothing but progress changes. The sim may jump directly to
the next tick at which any threshold is crossed (tool full, intent full, status expiry,
trait timer, Deadline second, summon hit), computed with integer ceil division of the
remaining progress by the current rate. The jump must be observably identical to
stepping: a property test runs random inputs both ways and compares event logs.
Target: ≥ 200 full bot runs per second per core in the balance CLI.

## Integer maths

`src/sim/int.ts` is the only place with arithmetic helpers; all are tested:

| Helper | Definition |
|---|---|
| `pct(x, p)` | `Math.floor((x * (100 + p) + 50) / 100)` (round half up) |
| `mulDiv(x, a, b)` | `Math.floor(x * a / b)`; asserts safe integers |
| `clamp(x, lo, hi)` | integer clamp |
| `ceilDiv(a, b)` | integer ceil for positive operands |

Rules: every stored number is a safe integer; divisions are always wrapped in
`Math.floor`/`ceilDiv`; no `**`, no `Math.sqrt`/trig; dev builds assert
`Number.isSafeInteger` on every stored value written by `int.ts`.

## RNG

- Algorithm: **sfc32** (4 × uint32 state), serialisable as `[a, b, c, d]`.
- Seed strings (e.g. `K7Q2-M9XA`, or `daily-2026-10-01`) are hashed with **cyrb128** to
  4 × uint32.
- **Fork by path, not by state**: `fork(runSeed, 'combat/p1-r3-c2')` hashes
  `runSeed + '/' + path`. A subsystem's randomness never depends on how many numbers were
  drawn elsewhere, so changing the shop never changes a fight.
- Types: `Seed = string`, `Rng = [number, number, number, number]`, `Weighted<T>`.
- API (`src/sim/rng.ts`):
  - `createRng(seed: Seed): Rng`; `forkSeed(seed, path): Seed`; `fork(seed, path): Rng`
  - `nextU32(rng): number` (advances state); `nextInt(rng, n): number` in `[0, n)`
  - `int(rng, lo, hi): number` inclusive; `pick<T>(rng, arr): T`
  - `weighted<T>(rng, entries: readonly Weighted<T>[]): T`; `shuffle<T>(rng, arr): T[]` (Fisher–Yates, returns a copy)
  - `serialize(rng): string`; `restore(json): Rng`
  - No float API is exported.
- Combat randomness is rare by design (slice content uses none); every combat draw emits a
  `roll` event so the log explains it.

## Determinism rules (checked in review and tests)

1. No `Math.random`, `Date`, `performance`, timers, `crypto`, DOM, network.
2. No floating-point values in state or events; percentages are integer percent.
3. No iteration over `Set`/`Map`/object keys whose order depends on hashing; use arrays.
   Sorts use total-order comparators with an id tiebreak.
4. No dependence on `Array.prototype.sort` with inconsistent comparators, `toFixed`,
   `toLocaleString` or locale-sensitive string compare in the sim.
5. Content is frozen (`Object.freeze` in dev) and passed in; the sim never reads globals.
6. A determinism property test runs 200 random inputs twice and compares the logs, and a
   golden test pins the hashes of fixed seeds ([testing](testing.md)).
