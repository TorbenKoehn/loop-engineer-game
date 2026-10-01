// Tool output tokens and removal (docs/game/systems/context.md "Outputs"). No zone % on tokens.
import type { Ref } from '../../events.ts';
import { emit, type Sim, type ToolRt, toolRef } from '../state.ts';
import { updateZone } from './zone.ts';

function emitTokens(sim: Sim, src: Ref, v: number, kind: 'output' | 'removal'): void {
  const { S, N } = sim.agent.ctx;
  emit(sim, { kind: 'tokens', src, dst: 'ctx', v, d: { S, N, F: S + N, kind } });
}

/** Removes up to `n`: N first, then S down to B; emits only a non-zero change. Returns it. */
export function removeTokens(sim: Sim, src: Ref, n: number): number {
  const { ctx } = sim.agent;
  const fromN = Math.min(Math.max(0, n), ctx.N);
  const fromS = Math.max(0, Math.min(n - fromN, ctx.S - ctx.B));
  const removed = fromN + fromS;
  if (removed === 0) return 0;
  ctx.N -= fromN;
  ctx.S -= fromS;
  emitTokens(sim, src, -removed, 'removal');
  return removed;
}

/** After the effects: S += max(0, output + mods), negative output removes; then the zone once. */
export function addOutput(sim: Sim, tool: ToolRt, outputMods = 0): void {
  const { output } = tool.def;
  const src = toolRef(tool);
  if (output < 0) removeTokens(sim, src, -(output + outputMods));
  else {
    const out = Math.max(0, output + outputMods);
    sim.agent.ctx.S += out;
    if (out > 0) emitTokens(sim, src, out, 'output');
  }
  updateZone(sim); // overflow check: T028; output mods from items: E007
}
