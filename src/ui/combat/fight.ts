// One fight on screen. The run keeps only the input (state.ts "CombatRecord"), so the log is
// recomputed here once; the screen reads fire times, labels and compactions from it.
import type { Signal } from '@preact/signals';
import type { CombatEvent, Ref } from '../../sim/events.ts';
import { type CombatInput, resolveCombat } from '../../sim/index.ts';
import { type CombatView, initialView } from './fold.ts';
import { enemyLabels } from './names.ts';
import type { Playback } from './playback.ts';
import { fireTimes } from './timeline.ts';

export interface Fight {
  readonly harness: string;
  readonly input: CombatInput;
  readonly events: readonly CombatEvent[];
  /** The view before the first event. */
  readonly start: CombatView;
  /** `toolFired` times per slot. */
  readonly fires: readonly (readonly number[])[];
  /** Enemy display labels by ref (`Typo #2`). */
  readonly labels: ReadonlyMap<Ref, string>;
  readonly compactions: number;
}

/** What every combat view component reads: the fight and its playback. */
export interface Replay {
  readonly fight: Fight;
  readonly pb: Playback;
  /** Event index of the log line the player picked; -1 for none. */
  readonly picked: Signal<number>;
}

/** True while playback is paused on the picked log line and `ref` is its source or target. */
export function isPicked(r: Replay, ref: Ref): boolean {
  const i = r.picked.value;
  const e = r.fight.events[i];
  const here = r.pb.paused.value && r.pb.cursor.value === i + 1;
  return here && (e?.src === ref || e?.dst === ref);
}

export function loadFight(input: CombatInput, harness: string): Fight {
  const { events } = resolveCombat(input);
  const { tools } = input.agent;
  return {
    harness,
    input,
    events,
    start: initialView(tools.map((s) => ({ def: s.def.id, version: s.version }))),
    fires: fireTimes(events, tools.length),
    labels: enemyLabels(events),
    compactions: events.filter((e) => e.kind === 'compaction').length,
  };
}
