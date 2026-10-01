// Item scores for the greedy bot: tools by damage per weight, skills and memories by
// rarity, and the context-baseline check that keeps the loadout in the Focused zone.
import { content } from '../../../src/content/index.ts';
import type { Rarity } from '../../../src/content/types/basics.ts';
import type { Effect } from '../../../src/content/types/dsl.ts';
import type { ToolDef } from '../../../src/content/types/items.ts';
import type { ItemKind, OwnedItem, RunState } from '../../../src/run/state.ts';

/** Equip only while the baseline stays at or below this share of the window (Focused < 70%). */
export const BASELINE_MAX_PCT = 60;
/** Assumed signal tenths for `perSignalTenth` damage (S about 40% of W). */
const SIGNAL_TENTHS = 4;
/** Guardrails and healing count half as much as damage. */
const SUPPORT_SHARE = 0.5;
/** Floor for tools without damage, guard or heal (statuses, charge, context control). */
const UTILITY = 0.5;
const RARITY_SCORE: Readonly<Record<Rarity, number>> = { common: 1, uncommon: 2, rare: 3 };

type Version = 1 | 2 | 3;
const at = (v: number | readonly number[], version: Version): number =>
  typeof v === 'number' ? v : (v[version - 1] ?? 0);

/** Damage-equivalent per activation of one effect. */
function effectPower(e: Effect, version: Version): number {
  if (e.do === 'dmg') {
    const perTenth = e.perSignalTenth ? at(e.perSignalTenth, version) * SIGNAL_TENTHS : 0;
    return at(e.v, version) + perTenth;
  }
  if (e.do === 'guard' || e.do === 'heal') return at(e.v, version) * SUPPORT_SHARE;
  return 0;
}

const toolDef = (id: string): ToolDef | undefined => content.tools.find((t) => t.id === id);

/** Damage-equivalent per second per weight point of tool `id` at `version`. */
export function toolScore(id: string, version: Version): number {
  const def = toolDef(id);
  if (!def) return 0;
  const power = def.effects.reduce((sum, e) => sum + effectPower(e, version), 0);
  const perSecond = Math.max(UTILITY, (power * 1000) / def.cooldownMs);
  return perSecond / Math.max(1, def.weight);
}

/** Content weight of an item; tools add their weight modifier. */
export function itemWeight(item: OwnedItem): number {
  if (item.kind === 'tool') return (toolDef(item.tool.id)?.weight ?? 0) + item.tool.weightMod;
  const defs = item.kind === 'skill' ? content.skills : content.memories;
  return defs.find((d) => d.id === item.id)?.weight ?? 0;
}

/** Score of an item; skills and memories rank by rarity, tools by damage per weight. */
export function itemScore(item: OwnedItem): number {
  if (item.kind === 'tool') return toolScore(item.tool.id, item.tool.version);
  const defs = item.kind === 'skill' ? content.skills : content.memories;
  const def = defs.find((d) => d.id === item.id);
  return def ? RARITY_SCORE[def.rarity] : 0;
}

/** The fight-start baseline B (context.md#quantities) without lessons. */
export function baseline(state: RunState): number {
  const { setup, agent } = state;
  const harness = content.harnesses.find((h) => h.id === setup.harness);
  const prompt = content.prompts.find((p) => p.id === setup.prompt);
  const items: OwnedItem[] = [
    ...agent.tools.map((tool): OwnedItem => ({ kind: 'tool', tool })),
    ...agent.skills.map((id): OwnedItem => ({ kind: 'skill', id })),
    ...agent.memories.map((id): OwnedItem => ({ kind: 'memory', id })),
  ];
  const own = items.reduce((sum, i) => sum + itemWeight(i), 0);
  return (harness?.model.baseWeight ?? 0) + (prompt?.weight ?? 0) + own;
}

const windowOf = (state: RunState): number =>
  content.harnesses.find((h) => h.id === state.setup.harness)?.model.window ?? 0;

const EQUIPPED = { tool: 'tools', skill: 'skills', memory: 'memories' } as const;
const SLOTS = { tool: 'tools', skill: 'skills', memory: 'memory' } as const;

/** Whether `item` would be equipped (free slot) and keep B within BASELINE_MAX_PCT of W. */
export function fitsLoadout(state: RunState, item: OwnedItem): boolean {
  const { agent } = state;
  const free = agent[EQUIPPED[item.kind]].length < agent.slots[SLOTS[item.kind]];
  const b = baseline(state) + itemWeight(item);
  return free && b * 100 <= windowOf(state) * BASELINE_MAX_PCT;
}

/** Whether a tool `id` is owned below v3, so gaining it merges as an upgrade. */
export function isUpgrade(state: RunState, kind: ItemKind, id: string): boolean {
  if (kind !== 'tool') return false;
  const { tools, stash } = state.agent;
  const owned = [...tools, ...stash.flatMap((i) => (i.kind === 'tool' ? [i.tool] : []))];
  return owned.some((t) => t.id === id && t.version < 3);
}
