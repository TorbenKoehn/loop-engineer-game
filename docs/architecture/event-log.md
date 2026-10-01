---
title: Combat event log format
summary: The combat event log - event shape, entity references, the complete event kind list with payloads, ordering, canonical serialisation and hashing for golden tests.
keywords: [event-log, combat, serialisation, golden-tests, replay, determinism]
type: doc
status: active
updated: 2026-10-01
related_code: [src/sim/events.ts, src/sim/combat/enemy/spawn.ts, src/sim/combat/status/statuses.ts, src/sim/combat/status/status-effects.ts, src/sim/combat/context/zone.ts, src/sim/combat/context/tokens.ts, src/sim/combat/context/compaction.ts]
related: [sim-core.md, ui.md, testing.md, adr/adr-002-deterministic-sim.md]
---

# Combat event log format

The event log is the single output of a fight that the UI, the text log, tooltips
("why?"), juice, audio, stats, achievements and tests consume. It is data only: no text.

## Event shape

```ts
export interface CombatEvent {
  seq: number;        // 0, 1, 2, … strictly increasing within a fight
  t: number;          // integer ms since fight start
  kind: EventKind;
  src?: Ref;          // who caused it
  dst?: Ref;          // who it affected
  v?: number;         // the main integer value (damage, tokens, ms…)
  d?: EventData;      // kind-specific integers and ids, flat, no nesting beyond one level
}
export type Ref = `a` | `t${number}` | `e${number}` | `s${number}` | 'ctx' | 'sys';
```

Refs: `a` agent, `t<slot>` tool by slot index, `e<uid>` enemy by spawn uid (stable when
the line shifts), `s<uid>` summon, `ctx` the context bar, `sys` system (Deadline, timers).

## Event kinds

| Kind | src -> dst | `v` | `d` |
|---|---|---|---|
| `fightStart` | sys | deadlineMs | `{ W, B, S, N, zone, trust, maxTrust, policyOff? }` |
| `spawn` | e/sys -> e | sev | `{ def, index, reason: 'start'\|'split'\|'clone'\|'intent'\|'stage'\|'event' }` |
| `intentSet` | e | windupMs | `{ intent, ix }` |
| `toolFired` | t | progress overflow (0) | `{ def, version, echo? }` |
| `pipe` | t -> t | ms | `{ chain }` (chain step, 1-based within 1000 ms) |
| `charge` | t -> t | ms added (`ms x 100` progress, capped at full) | `{ cause }` (the source tool def id; non-pipe charge effects) |
| `damage` | t/e/s/sys -> a/e | final amount | `{ base, flat, pct, armor, guard, sev, zone, why: string[] }` (ids of modifiers) |
| `guard` | t/e -> a/e | amount | `{ total }` |
| `heal` | t/e -> a/e | amount | `{ total }` |
| `tokens` | t/e -> ctx | delta (±) | `{ S, N, F, kind: 'output'\|'noise'\|'removal'\|'baseline'\|'report' }` |
| `zoneChanged` | ctx | new zone ix | `{ from, to, F, W }` |
| `compaction` | ctx | stun ms | `{ kind: 'auto'\|'planned'\|'tool', S, lostBuff? }` |
| `statusOn` / `statusOff` | t/e -> a/t/e | duration ms | `{ status, remaining }` |
| `prime` / `primeUsed` | t -> t | pct | `{ filter }` |
| `trait` | e | value | `{ trait, what }` (Grow, Leak, Flaky toggle, StageTimer reset…) |
| `armorBroken` | t -> e | layer ix | `{ remaining }` |
| `enemyActed` | e -> a | — | `{ intent, verbs }` |
| `redirect` | e -> a | — | `{ consumed }` |
| `summon` / `summonEnd` | t -> s | value / report tokens | `{ lifeMs }` |
| `resolved` | e | — | `{ by }` (ref of the killing source) |
| `roll` | any | result | `{ lo, hi, purpose }` |
| `deadline` | sys | k (damage this second) | `{}` |
| `fightEnd` | sys | endT | `{ outcome, reason, trust }` |

Conventions:

- **Zone index**: `zone` in `fightStart`, `damage` and `zoneChanged` (`v`, `from`, `to`) is
  the array index 0 Cold, 1 Focused, 2 Rot, 3 Overflow. `damage.zone` is the zone when the
  hit lands.
- **`tokens`**: `v` is the actual change in `F` (after clamping); no event is emitted when
  the change is 0.
- **Dropped spawn**: a `spawn` intent blocked by its limits emits `spawn` with `src` the
  spawner, **no `dst`**, `v: 0` and `d.index: -1` (`reason: 'intent'`). No enemy is added.
- **`statusOff` on expiry**: `src: 'sys'`, `v: 0`.
- **`statusOff` via `clearStatus`**: `src` is the clearing tool, `v` is the ms that were
  left on the status (cut short).
- **`fightStart.policyOff`**: `1` when the compaction policy would loop and is disabled
  (UI warning); absent otherwise and for policy never. Added in `LOG_VERSION` 2.
- **`compaction`**: `d.kind` is `auto` (overflow, Stun 2000 ms), `planned` (policy) or
  `tool` (the `compact` effect of a tool or item rule); both Stun 1000 ms (`v`).
  `d.S` is the signal after the reset (`N` is 0). `lostBuff` names the
  buff an auto-compaction removed: `<tool ref>:haste` (followed by `statusOff` from `ctx`)
  or `<tool ref>:<prime id>`, e.g. `t2:prime:read_file`; absent when none was held.

`why` lists modifier ids in application order: flat adds first, then % mods as zone,
passive item mods in slot order (`<kind>:<def id>`, kind `trait|prompt|skill|memory|lesson`), primes
(`zone:focused`, `skill:unix_philosophy`, `prime:read_file`); enemy hits list the
agent's `dmgTakenPct` mods, so the UI can render "14 dmg (Focused +20%, piped +30%)" without
re-deriving rules. Adding a kind or a field is a **log format change**: bump
`LOG_VERSION` and update golden files (`npm run golden:update`, fixtures in `tools/golden/fixtures/`) in the same change.

## Ordering

- Events are appended in the exact order effects happen within the tick order; `seq`
  breaks ties for equal `t`.
- One activation produces, in order: `toolFired`, `primeUsed*` (one per consumed prime),
  its effect events (`damage`, `guard`, …), `tokens` (output), events of `toolFired` rules,
  `compaction?` (auto or planned, with its `statusOn` Stun and the lost buff's `statusOff?`), events of
  `compaction` rules, `zoneChanged?` (at most one per activation: the zone is updated once,
  after `F`, any compaction and the compaction rules changed it, so `zoneChanged` never
  enters Overflow), `pipe?`. A noise injection orders `tokens`, `compaction?`,
  `zoneChanged?` the same way.
- Item rule effects have `src: 'a'` (the agent). Rules raised by enemy actions, Deadline
  damage or step 2 run after that step (see [combat tick order](../game/systems/combat.md#tick-order));
  they update the zone once afterwards if any rule ran.
- The UI must never reorder events; playback is strictly by `seq`.

## Canonical serialisation and hashing

- **JSONL**: one event per line, keys in the fixed order `seq,t,kind,src,dst,v,d`,
  absent fields omitted, `d` keys sorted alphabetically, no whitespace.
- **Hash**: SHA-256 of the UTF-8 JSONL, hex. Node tests use `node:crypto`; the browser
  uses `crypto.subtle` for desync reports (outside `src/sim`).
- Golden files store `{ seed, inputHash, logHash, events: n }` per fight, and the full
  JSONL for 5 short reference fights to make diffs readable.

## Size

A 30 s normal fight produces about 300–600 events (about 40–80 kB as JSONL). Logs are
held in memory only for the current fight and the post-fight review; they are not saved.
