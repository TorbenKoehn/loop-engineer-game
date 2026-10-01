// Mutable working copy of one fight, created from CombatInput; plus the event emitter.
// Plain data only, so a snapshot is structuredClone-able (docs/architecture/sim-core.md).
import type { EnemyDef, Status, ToolDef, Value } from '../../content/types/index.ts';
import type { CombatEvent, Ref } from '../events.ts';
import { createRng, type Rng } from '../rng.ts';
import { type Ctx, createCtx } from './context/ctx.ts';
import { type Phase, scaleSev } from './enemy/phase.ts';
import type { CombatInput, ToolSetup, Version } from './types.ts';

export const TICK_MS = 50;
/** Progress unit is ms x 100; a rate is an integer percent. */
export const PROGRESS_PER_MS = 100;

/** One timed status on a unit; a unit's list is in application order. */
export interface StatusRt {
  readonly status: Status;
  /** ms left; expires at <= 0. */
  remaining: number;
}

/** A one-shot damage-formula buff waiting for its tool's next activation. */
export interface PrimeRt {
  /** Who primed: src of the `prime` and `primeUsed` events. */
  readonly src: Ref;
  /** Mod id in the why list: `prime:<source id>`. */
  readonly id: string;
  readonly pct: number;
  /** Filter as logged, e.g. `tag:Edit`. */
  readonly filter: string;
}

export interface ToolRt {
  readonly slot: number;
  readonly def: ToolDef;
  readonly version: Version;
  progress: number;
  statuses: StatusRt[];
  /** Received pipe progress since its own last activation. */
  piped: boolean;
  /** Consumed together on the next activation. */
  primes: PrimeRt[];
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
  /** Successful spawns per intent id this fight (spawn `perFight` cap). */
  readonly spawned: Record<string, number>;
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
  readonly ctx: Ctx;
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
  /** Encounter phase; scales enemies from earlier home phases. */
  readonly phase: Phase;
  /** Enemy defs that may enter the fight: the starting line, then spawnable defs. */
  readonly defs: readonly EnemyDef[];
  /** uid of the next enemy to enter the fight. */
  nextUid: number;
  readonly agent: AgentRt;
  /** Index 0 = front. */
  enemies: EnemyRt[];
  /** Step of the last pipe and t of the chain's first pipe. */
  readonly pipeChain: { step: number; startT: number };
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
    phase: encounter.phase,
    defs: [...encounter.enemies, ...(encounter.spawnDefs ?? [])],
    nextUid: encounter.enemies.length + 1,
    agent: {
      trust: agent.trust,
      maxTrust: agent.maxTrust,
      guard: 0,
      speed: agent.model.speed,
      statuses: [],
      tools: agent.tools.map(createTool),
      ctx: createCtx(input),
      taken: 0,
    },
    enemies: encounter.enemies.map((def, i) => createEnemy(def, i + 1, encounter.phase)),
    pipeChain: { step: 0, startT: 0 },
  };
}

const createTool = (setup: ToolSetup, slot: number): ToolRt => ({
  ...setup,
  slot,
  progress: 0,
  statuses: [],
  piped: false,
  primes: [],
  dealt: 0,
});

/** A fresh enemy at full, phase-scaled Severity on its first intent. */
export function createEnemy(def: EnemyDef, uid: number, phase: Phase): EnemyRt {
  const sev = scaleSev(def, phase);
  return {
    uid,
    def,
    sev,
    maxSev: sev,
    guard: 0,
    intentIx: 0,
    progress: 0,
    statuses: [],
    killedBy: 'sys',
    spawned: {},
  };
}

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
