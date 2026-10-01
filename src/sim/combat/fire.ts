// Tick step 4: the agent's tools fire left to right, then reset (no carry-over). An
// auto-compaction ends the step: tools that had not fired yet keep their progress for later.
// Primes are consumed by the activation; pipes fill the right neighbour before the loop reaches it.
import { compactIfFull } from './context/compaction.ts';
import { zoneMods } from './context/ctx.ts';
import { outputTokens } from './context/tokens.ts';
import { updateZone } from './context/zone.ts';
import { applyEffects } from './effects.ts';
import { activeSum, damageMods } from './mods/mods.ts';
import { pipe } from './order/pipes.ts';
import { consumePrimes } from './order/primes.ts';
import { fireRules } from './rules/engine.ts';
import { emit, PROGRESS_PER_MS, type Sim, toolRef } from './state.ts';

export function fireTools(sim: Sim): void {
  for (const tool of sim.agent.tools) {
    const need = tool.def.cooldownMs * PROGRESS_PER_MS;
    if (tool.progress < need) continue;
    const overflow = tool.progress - need;
    tool.progress = 0;
    const d = { def: tool.def.id, version: tool.version };
    emit(sim, { kind: 'toolFired', src: toolRef(tool), v: overflow, d });
    // Zone before the activation: Focused / Cold scale every amount, never tokens.
    const items = damageMods(sim, tool);
    applyEffects(sim, tool, [...zoneMods(sim.agent.ctx), ...items, ...consumePrimes(sim, tool)]);
    outputTokens(sim, tool, activeSum(sim, 'output', tool));
    fireRules(sim, { on: 'toolFired', slot: tool.slot }); // "when X fires": before compaction
    const compacted = compactIfFull(sim); // compaction?
    fireRules(sim); // compaction rules
    updateZone(sim); // once per activation: zoneChanged?
    tool.piped = false; // "was piped" lasts through this activation, then clears
    pipe(sim, tool); // a Stunned agent takes no pipe
    if (compacted) return;
  }
}
