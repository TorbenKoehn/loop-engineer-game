// Tick step 4: the agent's tools fire left to right, then reset (no carry-over).
import type { Value } from '../../content/types/index.ts';
import type { Ref } from '../events.ts';
import { pct } from '../int.ts';
import { emit, enemyRef, PROGRESS_PER_MS, type Sim, type ToolRt, toolRef } from './state.ts';
import type { Version } from './types.ts';

const VERSION_IX = { 1: 0, 2: 1, 3: 2 } as const;

export function valueAt(v: Value, version: Version): number {
  return typeof v === 'number' ? v : v[VERSION_IX[version]];
}

/** `damage` payload without modifiers (flat, %, zone, armor, Guardrails: T019, E003, E007). */
export function damageData(base: number, after: number) {
  return { base, flat: 0, pct: 0, armor: 0, guard: 0, sev: after, zone: 0, why: [] };
}

export function fireTools(sim: Sim): void {
  for (const tool of sim.agent.tools) {
    const need = tool.def.cooldownMs * PROGRESS_PER_MS;
    if (tool.progress < need) continue;
    const overflow = tool.progress - need;
    tool.progress = 0;
    const d = { def: tool.def.id, version: tool.version };
    emit(sim, { kind: 'toolFired', src: toolRef(tool), v: overflow, d });
    applyEffects(sim, tool);
  }
}

// TODO(T019): every effect kind and target selector; the skeleton handles dmg on the front.
function applyEffects(sim: Sim, tool: ToolRt): void {
  for (const effect of tool.def.effects) {
    if (effect.do === 'dmg') hitFront(sim, tool, valueAt(effect.v, tool.version));
  }
}

function hitFront(sim: Sim, tool: ToolRt, base: number): void {
  const enemy = sim.enemies.find((e) => e.sev > 0);
  if (!enemy) return;
  const dealt = Math.min(Math.max(1, pct(base, 0)), enemy.sev);
  enemy.sev -= dealt;
  const src: Ref = toolRef(tool);
  if (enemy.sev === 0) enemy.killedBy = src;
  tool.dealt += dealt;
  const d = damageData(base, enemy.sev);
  emit(sim, { kind: 'damage', src, dst: enemyRef(enemy), v: dealt, d });
}
