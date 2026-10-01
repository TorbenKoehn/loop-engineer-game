// Context bar quantities, baseline and zones (docs/game/systems/context.md "Quantities",
// "Zones", "Tuning knobs"). Pure: no Sim, no events; zone.ts emits zoneChanged.
import type { Accuracy, FightModifier, Zone } from '../../../content/types/index.ts';
import type { Mod } from '../damage.ts';
import { collectMods, type ModRt, statMods, sumMods } from '../mods/mods.ts';
import { createRules } from '../rules/state.ts';
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
  /** Blocker budget left this fight: `noiseBlock` mods (.gitignore) absorb the first noise. */
  block: number;
  /** `focusPct` mods: added to the Focused bonus, each with its own why id. */
  readonly focus: readonly Mod[];
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

/** Blockers subtract from incoming noise until the fight's budget is spent; returns the rest. */
export function blockNoise(ctx: Ctx, n: number): number {
  const blocked = Math.min(n, ctx.block);
  ctx.block -= blocked;
  return n - blocked;
}

/** Summed tokens of the startNoise and startSignal fight modifiers (events). */
function startTokens(mods: readonly FightModifier[]): { noise: number; signal: number } {
  const start = { noise: 0, signal: 0 };
  for (const m of mods) {
    if (m.mod === 'startNoise') start.noise += m.tokens;
    else if (m.mod === 'startSignal') start.signal += m.tokens;
  }
  return start;
}

/** Fight-start bar: W with window mods, S = B + startSignal, N = startNoise through blockers. */
export function createCtx(
  input: CombatInput,
  mods: readonly ModRt[] = collectMods(createRules(input).list),
): Ctx {
  const { model } = input.agent;
  const W = Math.max(WINDOW_MIN, model.window + sumMods(mods, 'window'));
  const B = baseline(input);
  const coldPenalty = COLD_PENALTY_PCT[model.accuracy];
  const start = startTokens(input.modifiers);
  const block = sumMods(mods, 'noiseBlock');
  const focus = statMods(mods, 'focusPct').map((m) => ({ id: m.id, pct: m.v }));
  const ctx: Ctx = { W, B, S: B + start.signal, N: 0, zone: 'cold', coldPenalty, block, focus };
  ctx.N = blockNoise(ctx, start.noise);
  ctx.zone = zoneOf(ctx.S + ctx.N, W);
  return ctx;
}

/** Damage-formula mod of the current zone for tool damage, Guardrails and healing. */
export function zoneMods(ctx: Ctx): Mod[] {
  if (ctx.zone === 'focused') return [{ id: 'zone:focused', pct: FOCUS_BONUS_PCT }, ...ctx.focus];
  if (ctx.zone === 'cold') return [{ id: 'zone:cold', pct: -ctx.coldPenalty }];
  return [];
}
