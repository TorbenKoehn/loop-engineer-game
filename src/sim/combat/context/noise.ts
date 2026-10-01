// Enemy noise injection (docs/game/systems/context.md "Noise"). Fight-start noise: ctx.ts.

import { scaleNoise } from '../enemy/phase.ts';
import { type EnemyRt, enemyRef, type Sim } from '../state.ts';
import { checkOverflow } from './compaction.ts';
import { blockNoise } from './ctx.ts';
import { emitTokens } from './tokens.ts';

export const ROT_NOISE_MULT = 2;

/** n -> phase scale -> x2 in Rot -> blockers -> N += n' (emitted if non-zero) -> overflow check. */
export function injectNoise(sim: Sim, enemy: EnemyRt, n: number): void {
  const { ctx } = sim.agent;
  const scaled = scaleNoise(enemy.def, sim.phase, n);
  const added = blockNoise(ctx, ctx.zone === 'rot' ? scaled * ROT_NOISE_MULT : scaled);
  if (added > 0) {
    ctx.N += added;
    emitTokens(sim, enemyRef(enemy), added, 'noise');
  }
  checkOverflow(sim);
}
