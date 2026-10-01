// Tiny deterministic event producer for the golden-log harness. Not combat rules: it only
// exercises the log format and the seeded RNG until resolveCombat exists (E002).
import type { CombatEvent } from '../events.ts';
import { fork, int, type Rng, type Seed } from '../rng.ts';

export interface StubInput {
  seed: Seed;
  /** Max tool activations before the stub fight times out. */
  shots: number;
}

type Unsequenced<E> = E extends CombatEvent ? Omit<E, 'seq'> : never;

type StubState = { events: CombatEvent[]; rng: Rng; t: number; sev: number };

const TICK_MS = 50;
const START_SEV = 30;
const DEADLINE_MS = 30000;

function emit(st: StubState, e: Unsequenced<CombatEvent>): void {
  st.events.push({ ...e, seq: st.events.length } as CombatEvent);
}

function shot(st: StubState): void {
  st.t += TICK_MS * int(st.rng, 10, 30);
  const { t } = st;
  const base = int(st.rng, 3, 9);
  emit(st, { t, kind: 'roll', src: 't0', v: base, d: { lo: 3, hi: 9, purpose: 'stub_damage' } });
  emit(st, { t, kind: 'toolFired', src: 't0', v: 0, d: { def: 'stub_tool', version: 1 } });
  const dealt = Math.min(base, st.sev);
  st.sev -= dealt;
  const d = { base, flat: 0, pct: 0, armor: 0, guard: 0, sev: st.sev, zone: 0, why: ['stub:roll'] };
  emit(st, { t, kind: 'damage', src: 't0', dst: 'e1', v: dealt, d });
}

/** Seed -> event log. Same input, same log, byte for byte. */
export function stubFight(input: StubInput): CombatEvent[] {
  const st: StubState = { events: [], rng: fork(input.seed, 'combat/stub'), t: 0, sev: START_SEV };
  const ctx = { W: 1000, B: 100, S: 100, N: 0, zone: 0, trust: 40, maxTrust: 40 };
  emit(st, { t: 0, kind: 'fightStart', src: 'sys', v: DEADLINE_MS, d: ctx });
  const spawn = { def: 'stub_bug', index: 0, reason: 'start' } as const;
  emit(st, { t: 0, kind: 'spawn', src: 'sys', dst: 'e1', v: START_SEV, d: spawn });
  for (let i = 0; i < input.shots && st.sev > 0; i++) shot(st);
  const won = st.sev === 0;
  if (won) emit(st, { t: st.t, kind: 'resolved', src: 'e1', d: { by: 't0' } });
  const end = won
    ? ({ outcome: 'win', reason: 'resolved' } as const)
    : ({ outcome: 'loss', reason: 'timeout' } as const);
  emit(st, { t: st.t, kind: 'fightEnd', src: 'sys', v: st.t, d: { ...end, trust: 40 } });
  return st.events;
}
