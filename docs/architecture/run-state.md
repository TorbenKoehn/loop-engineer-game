---
title: Run state and actions
summary: The serialisable RunState, the Action union, the pure apply reducer with validation, run modes, RNG fork paths, meta state and invariants.
keywords: [run-state, reducer, actions, state-machine, rng-paths, meta]
type: doc
status: active
updated: 2026-10-01
related_code: [src/run/replay.ts, src/run/apply.ts, src/run/new-run.ts, src/run/state.ts, src/run/rewards.ts, src/run/stats.ts, src/run/combat.ts, src/run/meta/meta.ts, src/run/meta/lessons.ts]
related: [sim-core.md, save.md, ui.md, ../game/systems/run-map.md, ../game/systems/economy.md, adr/adr-005-save-action-log.md]
---

# Run state and actions

## Contents
- Reducer
- RunState (shape)
- Modes
- Actions
- RNG fork paths
- Meta state
- Invariants (property-tested over random legal action sequences)

A run is a fold of serialisable actions over a serialisable state. UI, bots, tests and
replays all go through the same `apply`.

## Reducer

```ts
export type ApplyResult = { ok: true; state: RunState } | { ok: false; error: ActionError };
export function newRun(setup: RunSetup, meta: MetaView): RunState;
export function apply(state: RunState, action: Action): ApplyResult;
export function legalActions(state: RunState): readonly Action[]; // bots, tests
```

- Pure: no I/O, no clock, no `Math.random`; same bans as `src/sim`.
- Invalid actions return `ok: false` with a typed error (`'notReachable'`,
  `'insufficientCredits'`, `'baselineOverLimit'`…) and change nothing. Saves contain
  only accepted actions.
- `MetaView` is the read-only part of meta progress a run needs (unlocked ids,
  lessons, lint cap, run number), built by `metaView(meta)`. Only `newRun` reads it and
  copies it into `RunState.setup`, so `apply` and replays never depend on later meta
  changes.

## RunState (shape)

```ts
export interface RunState {
  v: 1;                                   // state schema version
  setup: { run: number; seed: string; harness: HarnessId; prompt: PromptId | null;
           lint: LintId[]; unlocked: UnlockSnapshot; lessons: LessonId[]; tutorial: boolean };
  mode: Mode;                             // see below
  phase: 1 | 2 | 3; loop: number;
  map: MapState;                          // nodes, edges, types, encounter ids, visited, current
  agent: { trust: number; maxTrust: number; credits: number;
           tools: OwnedTool[]; skills: SkillId[]; memories: MemoryId[]; stash: OwnedItem[];
           slots: { tools: number; skills: number; memory: number; stash: number };
           policy: 70 | 80 | 90 | 0; oncePerRun: string[] };
  pending: Pending | null;                // rewards, shop offers, event, rest, treasure
  nextFight: FightModifier[];             // from events
  combat: { nodeId: string; input: CombatInput; outcome: CombatSummary } | null;
  stats: RunStats;                        // counters for summary and achievements
  result: null | { outcome: 'shipped' | 'ctrlc' | 'abandoned'; td: number;
                   lessons: LessonId[] };     // AGENTS.md after the lesson choice
}
```

```ts
type ItemRef = { at: ItemKind | 'stash'; ix: number } | { at: 'gained' };
type RewardCard = { kind: 'tool' | 'skill'; id: ToolId | SkillId; rarity: Rarity };
type Pending =
  | { kind: 'promptOffer'; prompts: PromptId[] }
  | { kind: 'reward'; credits: number; interest: number; cards: RewardCard[] } // already paid
  | { kind: 'discard'; item: OwnedItem; next: Mode }   // gained without space
  | { kind: 'lessonOffer'; lessons: LessonId[] };      // run end, 3 lessons
// RunStats: { nodesVisited; taskPicksNoRare (pity at 6); nodesCleared (fights won);
//   cause; damageBySource; compactions; zoneMs[4]; lastFight: { zoneMs[4]; compactions } }
```

`ItemRef` names an equipped slot (`at` = kind, `ix`), a stash index, or the gained item
awaiting space. RunStats come from each fight's event log (`src/run/stats.ts`): damage
the agent took by enemy def id or `deadline`, the source of its last hit (`cause`), ms per
zone index (cold, focused, rot, overflow) per run (`zoneMs`) and of the last fight.

`OwnedTool = { id, version, weightMod }`. Everything is plain JSON-compatible data
(no `Map`, `Set`, `Date`, class instances, `undefined` values).

## Modes

```
setup -> promptPick -> map -> (fight -> combatReview -> reward)
                           -> shop | event | rest | treasure -> map
       map(boss) -> fight -> combatReview -> reward -> phaseEnd -> map(next phase)
       phase 3 boss won -> shipped (-> endless? -> map) ; trust 0 -> ctrlc ; -> runEnd
```

M1 slice: `continue` after a won Release ends the run (`result.outcome = 'shipped'`, no
reward); any lost fight ends it as `ctrlc`; `abandon` on the map as `abandoned` (no lesson
offer). Phase 1-2 boss rewards and `phaseEnd`: E012.

At run end (not abandon) `pending` holds the 3-lesson offer (`src/run/meta/lessons.ts`,
fork `lessons`). The "ended the run" source is `stats.cause` (the last hit, Deadline =
Process), for wins too. `pickLesson` appends while AGENTS.md has room (M1 capacity 1) and
otherwise needs `replace`, the line to overwrite (`noLessonSlot` if missing or invalid);
`skipLesson` keeps it. Either clears `pending`; then no action is legal.

| Mode | Legal actions |
|---|---|
| `promptPick` | `pickPrompt` |
| `map` | `travel`, build actions, `abandon` |
| `combatReview` | `continue` (the fight is already resolved) |
| `reward` | `pickReward`, `skipReward`, build actions |
| `shop` | `buy`, `sell`, `reroll`, `prune`, `leaveShop`, build actions |
| `event` | `chooseEvent`, build actions |
| `rest` | `restHeal`, `restUpgrade` |
| `treasure` | `takeTreasure` |
| `discard` | `discardItem` (when an item is gained with no space) |
| `phaseEnd` | `continue` |
| `shipped` | `shipIt`, `keepLooping` |
| `runEnd` | `pickLesson`, `skipLesson` |

## Actions

```ts
export type Action =
  | { t: 'pickPrompt'; prompt: PromptId } | { t: 'travel'; node: NodeId }
  | { t: 'continue' } | { t: 'pickReward'; ix: 0 | 1 | 2 } | { t: 'skipReward' }
  | { t: 'buy'; ix: number } | { t: 'sell'; item: ItemRef } | { t: 'reroll' }
  | { t: 'prune'; slot: number } | { t: 'leaveShop' }
  | { t: 'chooseEvent'; ix: number; pick?: readonly ItemRef[] }
  | { t: 'restHeal' } | { t: 'restUpgrade'; slot: number } | { t: 'takeTreasure' }
  | { t: 'discardItem'; item: ItemRef }
  | { t: 'moveTool'; from: number; to: number } | { t: 'equip'; stashIx: number; slot: number }
  | { t: 'unequip'; kind: ItemKind; slot: number } | { t: 'setPolicy'; policy: 70 | 80 | 90 | 0 }
  | { t: 'shipIt' } | { t: 'keepLooping' } | { t: 'pickLesson'; ix: number; replace?: number }
  | { t: 'skipLesson' } | { t: 'abandon' };
```

`travel` to a fight node builds the `CombatInput`, calls `resolveCombat(input)`, applies
the outcome (Trust, once-per-run flags, stats folded from the log) and switches to
`combatReview`. The log is not stored; the UI recomputes it from `input` for playback.

## Replay

```ts
export function replay(setup: SetupSnapshot, actions: readonly Action[]): ApplyResult;
```

`replay` takes the `SetupSnapshot` (`RunState.setup`, which holds the seed), not a bare
seed, and folds `actions` from `initialState(setup)`, stopping at the first rejected
action. Why: per [ADR-005](adr/adr-005-save-action-log.md) a save is setup plus accepted
actions; the snapshot already copied the meta unlocks and lessons, so a replay never
depends on later meta changes.

## RNG fork paths

| Path | Used for |
|---|---|
| `map/<phase>` and `map/loop<n>/<phase>` | map generation |
| `encounter/<nodeId>` | encounter pick |
| `combat/<nodeId>` | combat seed |
| `reward/<nodeId>` | credits roll and 1-of-3 cards |
| `shop/<nodeId>` and `shop/<nodeId>/reroll/<n>` | shop offers |
| `event/<nodeId>` | event pick and its 50% rolls |
| `treasure/<nodeId>`, `elite-memory/<nodeId>` | memories |
| `lessons`, `loop/<n>` | lesson offer, Endless forced lint rule |

Node ids are `p<phase>-r<row>-c<col>` (`p1-boss` for the boss; Endless prefixes `l<n>-`).

## Meta state

Separate from runs, in `src/run/meta/`: `MetaState = { v, lastRun, td, unlocked, lessons,
history }` with its own pure functions: `newMeta()`, `metaView(meta)` and
`endRun(meta, run, extras?)`. Later epics add `achievements`, `settings`, `tips`, `daily`
and `buyUnlock(meta, id)`; settings live here but are never read by the sim.

`endRun` takes a finished run (result set, lesson choice made) and:

- appends a `RunRecord` (meta-progression.md "Run history"; lint as rule ids, sim time as
  `zoneMs`) and keeps the last 100; `extras` carries what the pure core cannot know, the
  wall-clock `wallMs` and the replay `save` string (null otherwise);
- copies `result.lessons` into AGENTS.md;
- M1: adds the unlock node `power_tools` (`brute_force`) when a visited Critical Bug node
  was not lost;
- is idempotent by run id: `metaView` numbers the next run `lastRun + 1`, and runs at or
  below `lastRun` are ignored. Run 0 (a `MetaView` without `run`) is always recorded.

## Invariants (property-tested over random legal action sequences)

1. `0 ≤ trust ≤ maxTrust`, `credits ≥ 0`, tool versions in 1..3, slot counts respected.
2. Baseline of the equipped loadout ≤ 80% of the window after every build action.
3. `apply` never throws for any action from `legalActions`; every legal sequence ends in
   `runEnd` within 2000 actions.
4. `replay(setup, actions)` equals the incrementally built state (deep equal).
