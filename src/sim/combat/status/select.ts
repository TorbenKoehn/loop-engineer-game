// Own-tool selectors for status, charge and enemy verbs (docs/game/systems/statuses.md).
import type { Tag } from '../../../content/types/index.ts';
import { ceilDiv, mulDiv } from '../../int.ts';
import { PROGRESS_PER_MS, type Sim, type ToolRt } from '../state.ts';
import { toolRate } from './charge.ts';

/** 'all' = every own tool, as in enemy verbs. */
export type ToolPick =
  | 'fastest'
  | 'leftmost'
  | 'rightmost'
  | 'longestCharge'
  | 'all'
  | { readonly tag: Tag };

/** Ranks a tool: higher wins, ties go to the leftmost; undefined skips it. */
type Score = (tool: ToolRt, rate: number) => number | undefined;

/** Lowest `cooldownMs × 100 / currentRate`; tools at rate 0 are skipped. */
const fastest: Score = (tool, rate) =>
  rate === 0 ? undefined : -mulDiv(tool.def.cooldownMs, 100, rate);

/** Most ms left until it fires at its current rate; rate 0 never fires, so it ranks highest. */
const longestCharge: Score = (tool, rate) => {
  const left = Math.max(0, tool.def.cooldownMs * PROGRESS_PER_MS - tool.progress);
  return rate === 0 ? Number.MAX_SAFE_INTEGER : ceilDiv(left, rate);
};

export function pickTools(sim: Sim, sel: ToolPick): ToolRt[] {
  const { tools } = sim.agent;
  if (typeof sel === 'object') return tools.filter((t) => t.def.tags.includes(sel.tag));
  if (sel === 'all') return [...tools];
  if (sel === 'leftmost') return tools.slice(0, 1);
  if (sel === 'rightmost') return tools.slice(-1);
  return best(sim, sel === 'fastest' ? fastest : longestCharge);
}

function best(sim: Sim, score: Score): ToolRt[] {
  let top: ToolRt | undefined;
  let topScore = 0;
  for (const tool of sim.agent.tools) {
    const s = score(tool, toolRate(sim, tool));
    if (s === undefined || (top && s <= topScore)) continue;
    top = tool;
    topScore = s;
  }
  return top ? [top] : [];
}
