// Context bar quantities, baseline and zones (docs/game/systems/context.md "Quantities",
// "Zones", "Tuning knobs"). Pure: no Sim, no events; zone.ts emits zoneChanged.
import type { Accuracy, Zone } from '../../../content/types/index.ts';
import type { Mod } from '../damage.ts';
import type { CombatInput } from '../types.ts';

export const ZONE_COLD_PCT = 25;
export const ZONE_ROT_PCT = 70;
export const FOCUS_BONUS_PCT = 20;
export const COLD_PENALTY_PCT: Readonly<Record<Accuracy, number>> = {
  high: 15,
  normal: 25,
  low: 35,
};
export const ROT_RATE_PCT = 70;
export const WINDOW_MIN = 40;

/** Zone index in events (fightStart, damage, zoneChanged): array order. */
export const ZONES: readonly Zone[] = ['cold', 'focused', 'rot', 'overflow'];
export const zoneIx = (zone: Zone): number => ZONES.indexOf(zone);

/** The agent's context bar. Fill F = S + N. Policy and compaction state: T029. */
export interface Ctx {
  readonly W: number;
  readonly B: number;
  /** Signal tokens, S >= B. */
  S: number;
  /** Noise tokens from enemies. */
  N: number;
  zone: Zone;
  /** Percent subtracted from tool effects in Cold, from model accuracy. */
  readonly coldPenalty: number;
}

/** Integer zone tests on F = S + N against W. */
export function zoneOf(F: number, W: number): Zone {
  if (F >= W) return 'overflow';
  if (F * 100 < W * ZONE_COLD_PCT) return 'cold';
  if (F * 100 < W * ZONE_ROT_PCT) return 'focused';
  return 'rot';
}

const sumWeights = (items: readonly { readonly weight: number }[]): number =>
  items.reduce((sum, item) => sum + item.weight, 0);

/** B = harness base + prompt + tools + skills + memories + 1 per lesson. */
export function baseline(input: CombatInput): number {
  const { agent, prompt, skills, memories, lessons } = input;
  const tools = sumWeights(agent.tools.map((tool) => tool.def));
  const items = sumWeights(skills) + sumWeights(memories);
  return agent.model.baseWeight + prompt.weight + tools + items + lessons.length;
}

/** Fight-start bar: S = B, N = 0. Window mods: T030; start modifiers and overflow: T027. */
export function createCtx(input: CombatInput): Ctx {
  const { model } = input.agent;
  const W = Math.max(WINDOW_MIN, model.window);
  const B = baseline(input);
  const coldPenalty = COLD_PENALTY_PCT[model.accuracy];
  return { W, B, S: B, N: 0, zone: zoneOf(B, W), coldPenalty };
}

/** Damage-formula mod of the current zone for tool damage, Guardrails and healing. */
export function zoneMods(ctx: Ctx): Mod[] {
  if (ctx.zone === 'focused') return [{ id: 'zone:focused', pct: FOCUS_BONUS_PCT }];
  if (ctx.zone === 'cold') return [{ id: 'zone:cold', pct: -ctx.coldPenalty }];
  return [];
}
