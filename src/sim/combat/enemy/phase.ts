// Phase scaling for enemies fought outside their home phase
// (docs/game/systems/combat.md "Enemy intents and phase scaling"). Endless loops: E016.
import type { EnemyDef } from '../../../content/types/index.ts';
import { mulDiv } from '../../int.ts';

export type Phase = EnemyDef['homePhase'];

export const SEV_SCALE: Readonly<Record<Phase, number>> = { 1: 100, 2: 170, 3: 260 };
export const DMG_SCALE: Readonly<Record<Phase, number>> = { 1: 100, 2: 150, 3: 210 };
export const PHASE_NOISE_SCALE: Readonly<Record<Phase, number>> = { 1: 100, 2: 125, 3: 150 };

type Scale = Readonly<Record<Phase, number>>;

/** `n × scale[phase] / scale[home]` (floor) in a later phase; unchanged otherwise. */
const scaled = (scale: Scale, n: number, home: Phase, phase: Phase): number =>
  phase > home ? mulDiv(n, scale[phase], scale[home]) : n;

/** Max Severity of `def` when it enters a fight in `phase`. */
export const scaleSev = (def: EnemyDef, phase: Phase): number =>
  scaled(SEV_SCALE, def.sev, def.homePhase, phase);

/** Base damage `n` of an attack by `def` in `phase`. */
export const scaleDmg = (def: EnemyDef, phase: Phase, n: number): number =>
  scaled(DMG_SCALE, n, def.homePhase, phase);

/** Noise `n` injected by `def` in `phase`, before Rot and blockers. */
export const scaleNoise = (def: EnemyDef, phase: Phase, n: number): number =>
  scaled(PHASE_NOISE_SCALE, n, def.homePhase, phase);
