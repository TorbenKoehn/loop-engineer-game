// The context bar's slice of the view fold: W, B, S, N, zone and the noise sources, all read
// from fightStart, tokens, zoneChanged and compaction events (event-log.md).
import type { CombatEvent, Ref } from '../../sim/events.ts';

/** Zone index order of the log: 0 Cold, 1 Focused, 2 Rot, 3 Overflow. */
export const ZONES = ['cold', 'focused', 'rot', 'overflow'] as const;
export type ZoneId = (typeof ZONES)[number];

/** Noise in the window from one source (an enemy ref, or `sys` for fight-start noise). */
export interface NoiseSeg {
  readonly src: Ref;
  readonly n: number;
}

export interface CtxView {
  readonly W: number;
  readonly B: number;
  readonly S: number;
  readonly N: number;
  readonly zone: number;
  /** The planned-compaction policy would loop and is disabled. */
  readonly policyOff: boolean;
  readonly noise: readonly NoiseSeg[];
}

export const emptyCtx: CtxView = { W: 0, B: 0, S: 0, N: 0, zone: 0, policyOff: false, noise: [] };

/** Keeps the newest noise: drops the oldest tokens until the segments add up to `total`. */
function trimNoise(noise: readonly NoiseSeg[], total: number): readonly NoiseSeg[] {
  let excess = noise.reduce((sum, s) => sum + s.n, 0) - total;
  const kept: NoiseSeg[] = [];
  for (const s of noise) {
    const cut = Math.min(s.n, Math.max(0, excess));
    excess -= cut;
    if (s.n > cut) kept.push({ src: s.src, n: s.n - cut });
  }
  return kept;
}

function addNoise(noise: readonly NoiseSeg[], src: Ref, n: number): readonly NoiseSeg[] {
  const same = noise.find((s) => s.src === src);
  if (!same) return [...noise, { src, n }];
  return noise.map((s) => (s === same ? { src, n: s.n + n } : s));
}

export function foldCtx(ctx: CtxView, e: CombatEvent): CtxView {
  switch (e.kind) {
    case 'fightStart': {
      const { W, B, S, N, zone } = e.d;
      const noise = N > 0 ? [{ src: 'sys' as const, n: N }] : [];
      return { W, B, S, N, zone, policyOff: e.d.policyOff === 1, noise };
    }
    case 'tokens': {
      const grown =
        e.d.kind === 'noise' ? addNoise(ctx.noise, e.src ?? 'sys', e.v ?? 0) : ctx.noise;
      return { ...ctx, S: e.d.S, N: e.d.N, noise: trimNoise(grown, e.d.N) };
    }
    case 'zoneChanged':
      return { ...ctx, zone: e.d.to, W: e.d.W };
    case 'compaction':
      return { ...ctx, S: e.d.S, N: 0, noise: [] };
    default:
      return ctx;
  }
}
