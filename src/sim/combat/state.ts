// Mutable working copy of one fight, created from CombatInput; plus the event emitter.
// Plain data only, so a snapshot is structuredClone-able (docs/architecture/sim-core.md).
import type { EnemyDef, ToolDef } from '../../content/types/index.ts';
import type { CombatEvent, Ref } from '../events.ts';
import { clamp } from '../int.ts';
import { createRng, type Rng } from '../rng.ts';
import type { CombatInput, Version } from './types.ts';

export const TICK_MS = 50;
/** Progress unit is ms x 100; a rate is an integer percent. */
export const PROGRESS_PER_MS = 100;
export const ENEMY_RATE = 100;
const MIN_RATE = 10;
const MAX_RATE = 400;

export interface ToolRt {
  readonly slot: number;
  readonly def: ToolDef;
  readonly version: Version;
  progress: number;
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
  /** Ref of the source that dealt the final hit. */
  killedBy: Ref;
}

export interface AgentRt {
  trust: number;
  readonly maxTrust: number;
  /** Guardrails, capped at maxTrust. */
  guard: number;
  /** Charge rate in percent. Flat mods: T020. */
  readonly rate: number;
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
      rate: clamp(agent.model.speed, MIN_RATE, MAX_RATE),
      tools: agent.tools.map((s, slot) => ({ ...s, slot, progress: 0, dealt: 0 })),
      taken: 0,
    },
    enemies: encounter.enemies.map((def, i) => ({
      uid: i + 1,
      def,
      sev: def.sev,
      maxSev: def.sev,
      guard: 0,
      intentIx: 0,
      progress: 0,
      killedBy: 'sys' as Ref,
    })),
  };
}

type Unstamped<E> = E extends CombatEvent ? Omit<E, 'seq' | 't'> : never;
export type NewEvent = Unstamped<CombatEvent>;

/** Appends an event stamped with the next seq and the current t; a no-op when logging is off. */
export function emit(sim: Sim, e: NewEvent): void {
  if (sim.log) sim.events.push({ seq: sim.seq, t: sim.t, ...e } as CombatEvent);
  sim.seq++;
}

export const toolRef = (tool: ToolRt): Ref => `t${tool.slot}`;
export const enemyRef = (enemy: EnemyRt): Ref => `e${enemy.uid}`;
