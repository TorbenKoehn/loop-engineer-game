// resolveCombat: input -> fixed 50 ms ticks in the combat tick order -> result and event log.
// Rules: docs/game/systems/combat.md "Tick order"; API: docs/architecture/sim-core.md.
import { checkOverflow, policyOff } from './context/compaction.ts';
import { zoneIx } from './context/ctx.ts';
import { deadlineDamage } from './deadline.ts';
import { checkEnd, type End, resolveDead, WIN } from './end.ts';
import { enemiesAct } from './enemy/act.ts';
import { announceIntent } from './enemy/cycle.ts';
import { fireTools } from './fire.ts';
import { runRules } from './rules/engine.ts';
import { createSim, emit, enemyRef, type Sim, TICK_MS } from './state.ts';
import { chargeAll } from './status/charge.ts';
import { tickStatuses } from './status/statuses.ts';
import type { CombatInput, CombatOptions, CombatResult } from './types.ts';

export function resolveCombat(input: CombatInput, opts: CombatOptions = {}): CombatResult {
  const sim = createSim(input, opts.log !== false);
  startFight(sim);
  const end = runTicks(sim);
  if (end.outcome === 'win') runRules(sim, { on: 'fightWon' });
  const { agent } = sim;
  emit(sim, { kind: 'fightEnd', src: 'sys', v: sim.t, d: { ...end, trust: agent.trust } });
  return {
    ...end,
    endT: sim.t,
    agentAfter: {
      trust: agent.trust,
      maxTrust: agent.maxTrust,
      usedOncePerRun: sim.rules.usedOncePerRun,
    },
    events: sim.events,
    stats: { toolDamage: agent.tools.map((tool) => tool.dealt), damageTaken: agent.taken },
  };
}

function startFight(sim: Sim): void {
  const { trust, maxTrust, ctx } = sim.agent;
  const off = policyOff(ctx) ? { policyOff: 1 as const } : {}; // would loop: UI warning
  const zone = zoneIx(ctx.zone);
  const d = { W: ctx.W, B: ctx.B, S: ctx.S, N: ctx.N, zone, trust, maxTrust, ...off };
  emit(sim, { kind: 'fightStart', src: 'sys', v: sim.deadlineMs, d });
  checkOverflow(sim); // the one compaction check after the start modifiers
  for (const [index, enemy] of sim.enemies.entries()) {
    const spawn = { def: enemy.def.id, index, reason: 'start' } as const;
    emit(sim, { kind: 'spawn', src: 'sys', dst: enemyRef(enemy), v: enemy.sev, d: spawn });
  }
  for (const enemy of sim.enemies) announceIntent(sim, enemy);
  runRules(sim, { on: 'fightStart' }); // t = 0, slot order
}

function runTicks(sim: Sim): End {
  for (;;) {
    const end = tick(sim);
    if (end) return end;
  }
}

/** One tick. Step 2: timed rules; timed traits arrive with E007. */
function tick(sim: Sim): End | undefined {
  sim.t += TICK_MS; // 1
  tickStatuses(sim);
  runRules(sim, { on: 'every' }); // 2
  chargeAll(sim); // 3
  fireTools(sim); // 4
  if (sim.enemies.every((e) => e.sev <= 0)) {
    resolveDead(sim); // 5: ties favour the player, enemies do not act
    return WIN;
  }
  enemiesAct(sim); // 6
  deadlineDamage(sim); // 7
  runRules(sim);
  return checkEnd(sim); // 8, then the timeout cap
}
