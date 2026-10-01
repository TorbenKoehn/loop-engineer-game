// resolveCombat: input -> fixed 50 ms ticks in the combat tick order -> result and event log.
// Rules: docs/game/systems/combat.md "Tick order"; API: docs/architecture/sim-core.md.
import type { ModelStats } from '../../content/types/index.ts';
import { announceIntent, enemiesAct } from './enemies.ts';
import { fireTools } from './fire.ts';
import { createSim, emit, enemyRef, type Sim, TICK_MS } from './state.ts';
import { chargeAll } from './status/charge.ts';
import { tickStatuses } from './status/statuses.ts';
import type { CombatInput, CombatOptions, CombatResult, EndReason, Outcome } from './types.ts';

/** Hard cap after the Deadline: the fight is lost by timeout. */
export const OVERTIME_CAP_MS = 30_000;

interface End {
  readonly outcome: Outcome;
  readonly reason: EndReason;
}

const WIN: End = { outcome: 'win', reason: 'resolved' };
const LOSS_TRUST: End = { outcome: 'loss', reason: 'trust' };
const TIMEOUT: End = { outcome: 'loss', reason: 'timeout' };

export function resolveCombat(input: CombatInput, opts: CombatOptions = {}): CombatResult {
  const sim = createSim(input, opts.log !== false);
  startFight(sim, input.agent.model);
  const end = runTicks(sim);
  const { agent } = sim;
  emit(sim, { kind: 'fightEnd', src: 'sys', v: sim.t, d: { ...end, trust: agent.trust } });
  return {
    ...end,
    endT: sim.t,
    agentAfter: {
      trust: agent.trust,
      maxTrust: agent.maxTrust,
      usedOncePerRun: input.agent.usedOncePerRun,
    },
    events: sim.events,
    stats: { toolDamage: agent.tools.map((tool) => tool.dealt), damageTaken: agent.taken },
  };
}

// TODO(T025): real context bar quantities (B, S, N, zone) in fightStart.
function startFight(sim: Sim, model: ModelStats): void {
  const { trust, maxTrust } = sim.agent;
  const B = model.baseWeight;
  const d = { W: model.window, B, S: B, N: 0, zone: 0, trust, maxTrust };
  emit(sim, { kind: 'fightStart', src: 'sys', v: sim.deadlineMs, d });
  for (const [index, enemy] of sim.enemies.entries()) {
    const spawn = { def: enemy.def.id, index, reason: 'start' } as const;
    emit(sim, { kind: 'spawn', src: 'sys', dst: enemyRef(enemy), v: enemy.sev, d: spawn });
  }
  for (const enemy of sim.enemies) announceIntent(sim, enemy);
}

function runTicks(sim: Sim): End {
  for (;;) {
    const end = tick(sim);
    if (end) return end;
  }
}

/** One tick. Steps 2 (traits) and 7 (Deadline) are not part of the skeleton. */
function tick(sim: Sim): End | undefined {
  sim.t += TICK_MS; // 1
  tickStatuses(sim);
  chargeAll(sim); // 3
  fireTools(sim); // 4
  if (sim.enemies.every((e) => e.sev <= 0)) {
    resolveDead(sim); // 5: ties favour the player, enemies do not act
    return WIN;
  }
  enemiesAct(sim); // 6
  resolveDead(sim); // 8
  if (sim.enemies.length === 0) return WIN;
  if (sim.agent.trust <= 0) return LOSS_TRUST;
  return overtime(sim);
}

/** Death checks: resolves enemies at Severity <= 0, front to back. */
function resolveDead(sim: Sim): void {
  for (const enemy of sim.enemies) {
    if (enemy.sev <= 0)
      emit(sim, { kind: 'resolved', src: enemyRef(enemy), d: { by: enemy.killedBy } });
  }
  sim.enemies = sim.enemies.filter((e) => e.sev > 0);
}

// TODO(T023): Deadline overtime damage; until then only the hard cap ends a stalled fight.
function overtime(sim: Sim): End | undefined {
  return sim.t >= sim.deadlineMs + OVERTIME_CAP_MS ? TIMEOUT : undefined;
}
