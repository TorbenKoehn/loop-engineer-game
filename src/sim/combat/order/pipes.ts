// Pipes (docs/game/systems/combat.md "Pipes"): `pipeMs: P` adds P x 100 progress to the right
// neighbour, capped at full; the left-to-right fire loop then fires it in the same step.
import { activeSum } from '../mods/mods.ts';
import { emit, PROGRESS_PER_MS, type Sim, type ToolRt, toolRef } from '../state.ts';
import { hasStatus } from '../status/statuses.ts';

/** Pipes within this many ms of a chain's first pipe count up; later ones start a new chain. */
export const CHAIN_WINDOW_MS = 1000;

/** Throttled or Stunned, including a Stun on the agent that stops every tool. */
const halted = (sim: Sim, tool: ToolRt): boolean =>
  hasStatus(tool, 'throttle') || hasStatus(tool, 'stun') || hasStatus(sim.agent, 'stun');

/** Pipes from `from` into its right neighbour; never wraps (Feedback Loop: E007). */
export function pipe(sim: Sim, from: ToolRt): void {
  const own = from.def.pipeMs ?? 0; // pipeMs mods lengthen existing pipes only
  const ms = own > 0 ? own + activeSum(sim, 'pipeMs', from) : 0;
  const to = sim.agent.tools[from.slot + 1];
  if (ms <= 0 || !to || halted(sim, to)) return;
  to.progress = Math.min(to.def.cooldownMs * PROGRESS_PER_MS, to.progress + ms * PROGRESS_PER_MS);
  to.piped = true;
  const d = { chain: chainStep(sim) };
  emit(sim, { kind: 'pipe', src: toolRef(from), dst: toolRef(to), v: ms, d });
}

function chainStep(sim: Sim): number {
  const chain = sim.pipeChain;
  if (chain.step > 0 && sim.t - chain.startT < CHAIN_WINDOW_MS) chain.step++;
  else {
    chain.step = 1;
    chain.startT = sim.t;
  }
  return chain.step;
}
