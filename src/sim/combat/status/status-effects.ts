// Tool effects status, clearStatus and charge, and how their selectors pick recipients.
import type { Effect, Selector } from '../../../content/types/index.ts';
import { emit, PROGRESS_PER_MS, type Sim, type ToolRt, toolRef, valueAt } from '../state.ts';
import { selectTargets } from '../targeting.ts';
import { pickTools, type ToolPick } from './select.ts';
import { applyStatus, clearStatus, type Holder } from './statuses.ts';

type StatusEffect = Extract<Effect, { do: 'status' | 'clearStatus' | 'charge' }>;

/** One activation; `picks` keeps a selector's pick for all effects of that activation. */
export interface Activation {
  readonly tool: ToolRt;
  readonly picks: Map<string, Holder[]>;
}

const TOOL_PICKS: ReadonlySet<Selector> = new Set<Selector>([
  'fastest',
  'leftmost',
  'rightmost',
  'longestCharge',
]);
const isToolPick = (sel: Selector): sel is Exclude<ToolPick, 'all'> =>
  typeof sel === 'object' || TOOL_PICKS.has(sel);

export const isStatusEffect = (e: Effect): e is StatusEffect =>
  e.do === 'status' || e.do === 'clearStatus' || e.do === 'charge';

export function applyStatusEffect(sim: Sim, act: Activation, effect: StatusEffect): void {
  const src = toolRef(act.tool);
  for (const h of recipients(sim, act, effect.sel)) {
    if (effect.do === 'clearStatus') clearStatus(sim, src, h, effect.status);
    else if (effect.do === 'status') {
      applyStatus(sim, src, h, { status: effect.status, ms: valueAt(effect.ms, act.tool.version) });
    } else if ('slot' in h) chargeTool(sim, act.tool, h, valueAt(effect.ms, act.tool.version));
  }
}

/** Selectors are evaluated once per activation, so "clear Throttle, then Haste" hits one tool. */
function recipients(sim: Sim, act: Activation, sel: Selector): Holder[] {
  const key = JSON.stringify(sel);
  const cached = act.picks.get(key);
  if (cached) return cached;
  const picked = select(sim, act.tool, sel);
  act.picks.set(key, picked);
  return picked;
}

function select(sim: Sim, tool: ToolRt, sel: Selector): Holder[] {
  if (isToolPick(sel)) return pickTools(sim, sel);
  if (sel === 'tools') return pickTools(sim, 'all');
  if (sel === 'rightTool') return sim.agent.tools.slice(tool.slot + 1, tool.slot + 2);
  // TODO(T032): 'tool' names a rule-picked own tool; as an effect selector it picks none.
  if (sel === 'tool') return [];
  return selectTargets(sim, sel);
}

/** Adds `ms × 100` progress, capped at full; emits `charge` (v: ms, cause: the tool def). */
function chargeTool(sim: Sim, src: ToolRt, tool: ToolRt, ms: number): void {
  const full = tool.def.cooldownMs * PROGRESS_PER_MS;
  tool.progress = Math.min(full, tool.progress + ms * PROGRESS_PER_MS);
  const d = { cause: src.def.id };
  emit(sim, { kind: 'charge', src: toolRef(src), dst: toolRef(tool), v: ms, d });
}
