// Loadout selectors for the build panel: the numbers the next fight starts with, computed by
// the sim's own functions (docs/game/systems/context.md#quantities, harness-loadout.md).
import { content } from '../../content/index.ts';
import type { Zone } from '../../content/types/index.ts';
import { createCtx, baseline as simBaseline } from '../../sim/combat/context/ctx.ts';
import { collectMods, sumMods } from '../../sim/combat/mods/mods.ts';
import { createRules } from '../../sim/combat/rules/state.ts';
import { type BreakpointProgress, breakpoints, type CombatInput } from '../../sim/index.ts';
import { simModifiers } from '../events/modifiers.ts';
import type { AgentState, RunState } from '../state.ts';

/** Build-phase limit: equipping is refused when `B x 100 > W x LIMIT_PCT`. */
export const LIMIT_PCT = 80;

export function byId<T extends { readonly id: string }>(list: readonly T[], id: string | null): T {
  const found = list.find((x) => x.id === id);
  if (!found) throw new RangeError(`run: unknown content id '${id}'`);
  return found;
}

/** The CombatInput `agent` brings under the run's setup; fight nodes add seed and encounter. */
export function loadoutInput(state: RunState, agent: AgentState = state.agent): CombatInput {
  const { setup } = state;
  const harness = byId(content.harnesses, setup.harness);
  return {
    seed: '',
    agent: {
      model: harness.model,
      trust: agent.trust,
      maxTrust: agent.maxTrust,
      tools: agent.tools.map((t) => ({ def: byId(content.tools, t.id), version: t.version })),
      usedOncePerRun: [...agent.oncePerRun],
    },
    skills: agent.skills.map((id) => byId(content.skills, id)),
    memories: agent.memories.map((id) => byId(content.memories, id)),
    lessons: setup.lessons.map((id) => byId(content.lessons, id)),
    prompt: byId(content.prompts, setup.prompt),
    trait: harness.trait,
    policy: agent.policy,
    encounter: { enemies: [], spawnDefs: [], deadlineMs: 0, phase: state.phase, loop: state.loop },
    modifiers: simModifiers(state.nextFight),
  };
}

/** Baseline B of the equipped loadout. */
export const selectBaseline = (state: RunState): number => simBaseline(loadoutInput(state));

/** Window W with its modifiers (prompt, memories), min 40. */
export const selectWindow = (state: RunState): number => createCtx(loadoutInput(state)).W;

/** Zone at fight start, after next-fight start signal and noise. */
export const selectStartZone = (state: RunState): Zone => createCtx(loadoutInput(state)).zone;

/** Breakpoint progress of the equipped tools, as the sim counts it (chips `Shell 2/3`). */
export const selectBreakpoints = (state: RunState): BreakpointProgress[] =>
  breakpoints(state.agent.tools.map((t) => byId(content.tools, t.id)));

/**
 * Fight-start pipe ms of each equipped tool into its right neighbour (0 = none; the rightmost
 * never pipes). Pipe mods (POSIX) lengthen existing pipes only; mod conditions are not checked.
 */
export function selectPipes(state: RunState): number[] {
  const input = loadoutInput(state);
  const mods = collectMods(createRules(input).list);
  return input.agent.tools.map(({ def }, ix) => {
    const own = ix < input.agent.tools.length - 1 ? (def.pipeMs ?? 0) : 0;
    return own > 0 ? own + sumMods(mods, 'pipeMs', def) : 0;
  });
}

/** Whether `agent` breaks the build-phase limit under the run's setup (window mods included). */
export function overLimit(state: RunState, agent: AgentState = state.agent): boolean {
  const ctx = createCtx(loadoutInput(state, agent));
  return ctx.B * 100 > ctx.W * LIMIT_PCT;
}
