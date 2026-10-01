// Tool effects status, clearStatus and charge, and how their selectors pick recipients.
import type { Effect, Selector } from '../../../content/types/index.ts';
import type { Ref } from '../../events.ts';
import type { Mod } from '../damage.ts';
import { emit, PROGRESS_PER_MS, type Sim, type ToolRt, toolRef, valueAt } from '../state.ts';
import { selectTargets } from '../targeting.ts';
import type { Version } from '../types.ts';
import { pickTools, type ToolPick } from './select.ts';
import { applyStatus, clearStatus, type Holder } from './statuses.ts';

type StatusEffect = Extract<Effect, { do: 'status' | 'clearStatus' | 'charge' }>;

/** One activation; `picks` keeps a selector's pick for all effects of that activation. */
export interface Activation {
  /** The firing tool, or `a` for item rules; `id` is the def id (prime ids, charge causes). */
  readonly src: Ref;
  readonly id: string;
  /** The firing tool (version, default target, damage credit); none for item rules. */
  readonly tool?: ToolRt;
  /** A rule's own tool, for selector `tool`; `rightTool` is right of `tool ?? picked`. */
  readonly picked?: ToolRt;
  readonly picks: Map<string, Holder[]>;
  /** Damage-formula mods for every amount of this activation, e.g. consumed primes. */
  readonly mods: readonly Mod[];
}

const TOOL_PICKS: ReadonlySet<Selector> = new Set<Selector>([
  'fastest',
  'leftmost',
  'rightmost',
  'longestCharge',
]);
const isToolPick = (sel: Selector): sel is Exclude<ToolPick, 'all'> =>
  typeof sel === 'object' || TOOL_PICKS.has(sel);

/** Item rules have no version: v1. */
export const versionOf = (act: Activation): Version => act.tool?.version ?? 1;

export const isStatusEffect = (e: Effect): e is StatusEffect =>
  e.do === 'status' || e.do === 'clearStatus' || e.do === 'charge';

export function applyStatusEffect(sim: Sim, act: Activation, effect: StatusEffect): void {
  const { src } = act;
  const version = versionOf(act);
  for (const h of recipients(sim, act, effect.sel)) {
    if (effect.do === 'clearStatus') clearStatus(sim, src, h, effect.status);
    else if (effect.do === 'status') {
      applyStatus(sim, src, h, { status: effect.status, ms: valueAt(effect.ms, version) });
    } else if ('slot' in h) chargeTool(sim, act, h, valueAt(effect.ms, version));
  }
}

/** Selectors are evaluated once per activation, so "clear Throttle, then Haste" hits one tool. */
function recipients(sim: Sim, act: Activation, sel: Selector): Holder[] {
  const key = JSON.stringify(sel);
  const cached = act.picks.get(key);
  if (cached) return cached;
  const picked = select(sim, act, sel);
  act.picks.set(key, picked);
  return picked;
}

function select(sim: Sim, act: Activation, sel: Selector): Holder[] {
  if (isToolPick(sel)) return pickTools(sim, sel);
  if (sel === 'tools') return pickTools(sim, 'all');
  const base = act.tool ?? act.picked;
  if (sel === 'rightTool') return base ? sim.agent.tools.slice(base.slot + 1, base.slot + 2) : [];
  if (sel === 'tool') return act.picked ? [act.picked] : [];
  return selectTargets(sim, sel);
}

/** Adds `ms × 100` progress, capped at full; emits `charge` (v: ms, cause: the source def). */
function chargeTool(sim: Sim, act: Activation, tool: ToolRt, ms: number): void {
  const full = tool.def.cooldownMs * PROGRESS_PER_MS;
  tool.progress = Math.min(full, tool.progress + ms * PROGRESS_PER_MS);
  const d = { cause: act.id };
  emit(sim, { kind: 'charge', src: act.src, dst: toolRef(tool), v: ms, d });
}
