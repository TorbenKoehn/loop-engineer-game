// Mutable working copy of one fight, created from CombatInput; plus the event emitter.
// Plain data only, so a snapshot is structuredClone-able (docs/architecture/sim-core.md).
import type { EnemyDef, Status, ToolDef, Value } from '../../content/types/index.ts';
import type { CombatEvent, Ref } from '../events.ts';
import { createRng, type Rng } from '../rng.ts';
import type { CombatInput, Version } from './types.ts';

export const TICK_MS = 50;
/** Progress unit is ms x 100; a rate is an integer percent. */
export const PROGRESS_PER_MS = 100;

/** One timed status on a unit; a unit's list is in application order. */
export interface StatusRt {
  readonly status: Status;
  /** ms left; expires at <= 0. */
  remaining: number;
}

export interface ToolRt {
  readonly slot: number;
  readonly def: ToolDef;
  readonly version: Version;
  progress: number;
  statuses: StatusRt[];
  /** Damage dealt this fight (stats). */
  dealt: number;
}

export interface EnemyRt {
  readonly uid: number;
  readonly def: EnemyDef;
  sev: number;
  readonly maxSev: number;
  /** Guardrails, capped at maxSev. */
  guard: number;
  intentIx: number;
  progress: number;
  statuses: StatusRt[];
  /** Ref of the source that dealt the final hit. */
  killedBy: Ref;
}

export interface AgentRt {
  trust: number;
  readonly maxTrust: number;
  /** Guardrails, capped at maxTrust. */
  guard: number;
  /** Harness speed: the unclamped charge-rate base in percent. Flat rate mods: T033. */
  readonly speed: number;
  statuses: StatusRt[];
  readonly tools: ToolRt[];
  /** Damage taken this fight (stats). */
  taken: number;
}

export interface Sim {
  t: number;
  seq: number;
  readonly log: boolean;
  readonly events: CombatEvent[];
  readonly rng: Rng;
  readonly deadlineMs: number;
  readonly agent: AgentRt;
  /** Index 0 = front. */
  enemies: EnemyRt[];
}

export function createSim(input: CombatInput, log: boolean): Sim {
  const { agent, encounter } = input;
  return {
    t: 0,
    seq: 0,
    log,
    events: [],
    rng: createRng(input.seed),
    deadlineMs: encounter.deadlineMs,
    agent: {
      trust: agent.trust,
      maxTrust: agent.maxTrust,
      guard: 0,
      speed: agent.model.speed,
      statuses: [],
      tools: agent.tools.map((s, slot) => ({ ...s, slot, progress: 0, statuses: [], dealt: 0 })),
      taken: 0,
    },
    enemies: encounter.enemies.map((def, i) => createEnemy(def, i + 1)),
  };
}

/** A fresh enemy at full Severity on its first intent. */
export const createEnemy = (def: EnemyDef, uid: number): EnemyRt => ({
  uid,
  def,
  sev: def.sev,
  maxSev: def.sev,
  guard: 0,
  intentIx: 0,
  progress: 0,
  statuses: [],
  killedBy: 'sys',
});

type Unstamped<E> = E extends CombatEvent ? Omit<E, 'seq' | 't'> : never;
export type NewEvent = Unstamped<CombatEvent>;

/** Appends an event stamped with the next seq and the current t; a no-op when logging is off. */
export function emit(sim: Sim, e: NewEvent): void {
  if (sim.log) sim.events.push({ seq: sim.seq, t: sim.t, ...e } as CombatEvent);
  sim.seq++;
}

const VERSION_IX = { 1: 0, 2: 1, 3: 2 } as const;

/** A fixed value, or the entry of a v1/v2/v3 triple for `version`. */
export function valueAt(v: Value, version: Version): number {
  return typeof v === 'number' ? v : v[VERSION_IX[version]];
}

export const toolRef = (tool: ToolRt): Ref => `t${tool.slot}`;
export const enemyRef = (enemy: EnemyRt): Ref => `e${enemy.uid}`;
