// Standup choice outcomes applied to run state (docs/game/content/events.md#rules).
// Random picks and 50% rolls draw from the event RNG; gains can enter discard mode.
import { content } from '../../content/index.ts';
import type { Outcome, ToolPick } from '../../content/types/event.ts';
import { nextInt, pick, type Rng } from '../../sim/rng.ts';
import { gain, newItem, ownedTool } from '../gain.ts';
import { isUnlocked } from '../new-run.ts';
import type { AgentState, OwnedTool, RunState } from '../state.ts';

const MAX_VERSION = 3;

const tagsOf = (id: string) => content.tools.find((d) => d.id === id)?.tags ?? [];

/** Index of the equipped tool `p` names, or -1 when none matches. */
function toolIndex(tools: readonly OwnedTool[], p: ToolPick, rng: Rng): number {
  const ixs = tools.flatMap((t, ix) => {
    const fits =
      (!p.tag || (tagsOf(t.id) as readonly string[]).includes(p.tag)) &&
      t.version <= (p.maxVersion ?? MAX_VERSION) &&
      t.version >= (p.minVersion ?? 1);
    return fits ? [ix] : [];
  });
  if (ixs.length === 0) return -1;
  if (p.pick === 'leftmost') return ixs[0] as number;
  if (p.pick === 'rightmost') return ixs[ixs.length - 1] as number;
  if (p.pick === 'random') return pick(rng, ixs);
  throw new RangeError(`event: tool pick '${p.pick}' is not supported yet`);
}

/** Unlocked tools of the rarities, without owned v3 copies; a fixed `tool` id wins. */
function gainPool(state: RunState, o: Extract<Outcome, { do: 'gainTool' }>): string[] {
  if (o.tool) return [o.tool];
  return content.tools
    .filter(
      (d) =>
        isUnlocked(d.unlock, state.setup.unlocked) &&
        (o.rarity ?? []).includes(d.rarity) &&
        ownedTool(state.agent, d.id)?.version !== MAX_VERSION,
    )
    .map((d) => d.id);
}

const withAgent = (state: RunState, agent: Partial<AgentState>): RunState => ({
  ...state,
  agent: { ...state.agent, ...agent },
});

function version(state: RunState, o: Extract<Outcome, { do: 'version' }>, rng: Rng): RunState {
  const ix = toolIndex(state.agent.tools, o.tool, rng);
  if (ix < 0) return applyOutcomes(state, o.otherwise ?? [], rng);
  const tools = state.agent.tools.map((t, i) => {
    if (i !== ix) return t;
    const v = Math.min(MAX_VERSION, Math.max(1, t.version + o.n));
    return { ...t, version: v as OwnedTool['version'] };
  });
  return withAgent(state, { tools });
}

function applyOutcome(state: RunState, o: Outcome, rng: Rng): RunState {
  const { agent } = state;
  switch (o.do) {
    case 'credits':
      return withAgent(state, { credits: Math.max(0, agent.credits + o.n) });
    case 'trust':
      return withAgent(state, { trust: Math.min(agent.maxTrust, Math.max(0, agent.trust + o.n)) });
    case 'version':
      return version(state, o, rng);
    case 'gainTool': {
      const pool = gainPool(state, o);
      return pool.length === 0 ? state : gain(state, newItem('tool', pick(rng, pool)), state.mode);
    }
    case 'slot': {
      const key = o.kind === 'tool' ? 'tools' : 'memory';
      return withAgent(state, { slots: { ...agent.slots, [key]: agent.slots[key] + o.n } });
    }
    case 'nextFight':
      return { ...state, nextFight: [...state.nextFight, o.mod] };
    case 'chance':
      return nextInt(rng, 100) < o.pct ? applyOutcomes(state, o.then, rng) : state;
    default:
      // M2 verbs (max Trust, skills, memories, delete, custom) land with their events (E015).
      throw new RangeError(`event: outcome '${o.do}' is not supported yet`);
  }
}

/** Applies `outcomes` in order. */
export function applyOutcomes(state: RunState, outcomes: readonly Outcome[], rng: Rng): RunState {
  return outcomes.reduce((s, o) => applyOutcome(s, o, rng), state);
}
