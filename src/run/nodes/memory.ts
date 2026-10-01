// Memory grants: Free Tier (takeTreasure) and the Critical Bug bonus.
// See docs/game/systems/run-map.md#rewards-per-node; forks treasure/ and elite-memory/.
import { content } from '../../content/index.ts';
import { fork, pick } from '../../sim/rng.ts';
import { type ApplyResult, fail, ok } from '../actions.ts';
import { gain, newItem, ownsUnique } from '../gain.ts';
import { isUnlocked } from '../new-run.ts';
import type { RewardPending, RunState } from '../state.ts';

/** One random unlocked memory not yet owned, from `<source>/<nodeId>`; null if none is left. */
function rollMemory(state: RunState, source: string, nodeId: string) {
  const pool = content.memories.filter(
    (m) => isUnlocked(m.unlock, state.setup.unlocked) && !ownsUnique(state.agent, 'memory', m.id),
  );
  if (pool.length === 0) return null;
  return newItem('memory', pick(fork(state.setup.seed, `${source}/${nodeId}`), pool).id);
}

/** Free Tier: the gained memory (or a discard prompt) and back to the map. */
export function takeTreasure(state: RunState): ApplyResult {
  if (state.mode !== 'treasure' || !state.map.current) return fail('wrongMode');
  const item = rollMemory(state, 'treasure', state.map.current);
  return ok(item ? gain(state, item, 'map') : { ...state, mode: 'map', pending: null });
}

/** Critical Bug win: one extra memory on top of the open reward; discard resumes the reward. */
export function eliteMemory(state: RunState): RunState {
  const reward = state.pending as RewardPending;
  const item = rollMemory(state, 'elite-memory', state.combat?.nodeId ?? '');
  if (!item) return state;
  const gained = gain(state, item, 'reward');
  if (gained.pending?.kind !== 'discard') return { ...gained, pending: reward };
  return { ...gained, pending: { ...gained.pending, resume: reward } };
}
