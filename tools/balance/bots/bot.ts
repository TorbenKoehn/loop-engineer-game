// The bot contract for tools/balance (docs/architecture/testing.md#balance-sim-toolsbalance).
import type { Action } from '../../../src/run/actions.ts';
import type { RunState } from '../../../src/run/state.ts';
import { fork, type Rng } from '../../../src/sim/rng.ts';

/**
 * A pure policy: the same state and legal list always give the same action. Randomness
 * comes only from `botRng`, which forks the run seed, so a seed fixes the whole run.
 * `legal` is `legalActions(state)` and is never empty when a bot is called.
 */
export type Bot = (state: RunState, legal: readonly Action[]) => Action;

/**
 * An RNG forked from the run seed and the decision point. The label holds everything an
 * action can change (mode, position, agent, pending offer), so successive decisions draw
 * from different streams without the bot keeping a counter.
 */
export function botRng(state: RunState, bot: string): Rng {
  const { mode, map, agent, pending } = state;
  const point = JSON.stringify([mode, map.current, map.visited.length, agent, pending]);
  return fork(state.setup.seed, `bot/${bot}/${point}`);
}
