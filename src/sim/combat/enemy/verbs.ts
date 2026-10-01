// Enemy action verbs (docs/game/systems/statuses.md "Enemy action verbs"). Attacks and
// statuses target the agent and its tools; guard and heal go to the acting enemy itself.
import type { Status, Verb, VerbSel } from '../../../content/types/index.ts';
import type { Ref } from '../../events.ts';
import { computeAmount, dealDamage } from '../damage.ts';
import { gainGuard, heal } from '../effects.ts';
import { type EnemyRt, enemyRef, type Sim } from '../state.ts';
import { pickTools } from '../status/select.ts';
import { applyStatus } from '../status/statuses.ts';
import { scaleDmg } from './phase.ts';
import { spawnEnemy } from './spawn.ts';

/** Context bar entry points the verbs call; the context bar (E003) supplies them. */
export interface ContextHooks {
  /** Raw `n` of a noise verb; phase noise scale, Rot and blockers are applied by the bar. */
  readonly noise: (sim: Sim, src: Ref, n: number) => void;
}

// TODO(T027): the real noise injection into the context bar.
export const NO_CONTEXT: ContextHooks = { noise: () => undefined };

/** One resolving intent: the acting enemy, its intent id and the context hooks. */
export interface Act {
  readonly sim: Sim;
  readonly enemy: EnemyRt;
  readonly intent: string;
  readonly ctx: ContextHooks;
}

type Handler<V extends Verb> = (act: Act, v: V) => void;
type Handlers = { readonly [K in Verb['verb']]: Handler<Extract<Verb, { verb: K }>> };

/** Enemy amount (phase-scaled base, floor) -> agent Guardrails -> Trust. Damage mods: T033. */
function hitAgent({ sim, enemy }: Act, n: number): void {
  dealDamage(sim, enemyRef(enemy), sim.agent, computeAmount(scaleDmg(enemy.def, sim.phase, n)));
}

function statusTools({ sim, enemy }: Act, status: Status, sel: VerbSel, ms: number): void {
  for (const tool of pickTools(sim, sel)) applyStatus(sim, enemyRef(enemy), tool, { status, ms });
}

const HANDLERS: Handlers = {
  hit: (act, v) => hitAgent(act, v.n),
  multiHit: (act, v) => {
    for (let i = 0; i < v.times; i++) hitAgent(act, v.n);
  },
  noise: ({ sim, enemy, ctx }, v) => ctx.noise(sim, enemyRef(enemy), v.n),
  throttle: (act, v) => statusTools(act, 'throttle', v.sel, v.ms),
  slow: (act, v) => statusTools(act, 'slow', v.sel, v.ms),
  stun: ({ sim, enemy }, v) =>
    applyStatus(sim, enemyRef(enemy), sim.agent, { status: 'stun', ms: v.ms }),
  guard: ({ sim, enemy }, v) => {
    gainGuard(sim, enemyRef(enemy), enemy, computeAmount(v.n));
  },
  heal: ({ sim, enemy }, v) => {
    heal(sim, enemyRef(enemy), enemy, computeAmount(v.n));
  },
  spawn: ({ sim, enemy, intent }, v) => spawnEnemy(sim, { enemy, intent }, v),
  // Not M1 core: redirect arrives with Prompt Injection (M2), custom with boss handlers (E007).
  redirect: () => undefined,
  custom: () => undefined,
};

export function runVerb(act: Act, verb: Verb): void {
  (HANDLERS[verb.verb] as Handler<Verb>)(act, verb);
}
