// Zone recomputation after every change of F (docs/game/systems/context.md "Zones").
import { emit, type Sim } from '../state.ts';
import { zoneIx, zoneOf } from './ctx.ts';

/** Recomputes the zone from F = S + N; emits `zoneChanged` when it differs. */
export function updateZone(sim: Sim): void {
  const { ctx } = sim.agent;
  const F = ctx.S + ctx.N;
  const zone = zoneOf(F, ctx.W);
  if (zone === ctx.zone) return;
  const d = { from: zoneIx(ctx.zone), to: zoneIx(zone), F, W: ctx.W };
  ctx.zone = zone;
  emit(sim, { kind: 'zoneChanged', src: 'ctx', v: d.to, d });
}
