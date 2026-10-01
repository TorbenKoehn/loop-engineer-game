// Tick step 4: the agent's tools fire left to right, then reset (no carry-over).
// Primes are consumed by the activation; pipes fill the right neighbour before the loop reaches it.
import { applyEffects } from './effects.ts';
import { pipe } from './order/pipes.ts';
import { consumePrimes } from './order/primes.ts';
import { emit, PROGRESS_PER_MS, type Sim, toolRef } from './state.ts';

export function fireTools(sim: Sim): void {
  for (const tool of sim.agent.tools) {
    const need = tool.def.cooldownMs * PROGRESS_PER_MS;
    if (tool.progress < need) continue;
    const overflow = tool.progress - need;
    tool.progress = 0;
    const d = { def: tool.def.id, version: tool.version };
    emit(sim, { kind: 'toolFired', src: toolRef(tool), v: overflow, d });
    applyEffects(sim, tool, consumePrimes(sim, tool));
    tool.piped = false; // "was piped" lasts through this activation, then clears
    pipe(sim, tool);
  }
}
