import { describe, expect, it, vi } from 'vitest';
import type { Verb } from '../../../content/types/index.ts';
import type { CombatEvent } from '../../events.ts';
import { fight, intent, makeEnemy, makeTool } from '../../testing/builders.ts';
import { createSim, type Sim, type ToolRt } from '../state.ts';
import { hasStatus } from '../status/statuses.ts';
import { enemiesAct } from './act.ts';
import type { ContextHooks } from './verbs.ts';

/** Tools: t0 slow (4000 ms), t1 fast [Edit] (1000 ms), t2 (3000 ms). One enemy e1 at Sev 50. */
function setup(phase: 1 | 2 | 3 = 1): Sim {
  const tools = [
    makeTool({ id: 'slow', cooldownMs: 4000 }),
    makeTool({ id: 'fast', cooldownMs: 1000, tags: ['Edit'] }),
    makeTool({ id: 'mid', cooldownMs: 3000 }),
  ];
  return createSim(fight({ tools, phase, enemies: [makeEnemy({ sev: 50 })] }), true);
}

const enemyOf = (sim: Sim) => {
  const [enemy] = sim.enemies;
  if (!enemy) throw new Error('missing enemy');
  return enemy;
};

/** Gives e1 a full intent with `verbs` and resolves it; returns the verb events. */
function act(sim: Sim, verbs: [Verb] | [Verb, Verb], ctx?: ContextHooks): CombatEvent[] {
  const enemy = enemyOf(sim);
  Object.assign(enemy, { def: { ...enemy.def, cycle: [intent('x', 1000, ...verbs)] } });
  enemy.progress = 1000 * 100;
  const from = sim.events.length;
  enemiesAct(sim, ctx);
  return sim.events.slice(from).filter((e) => e.kind !== 'enemyActed' && e.kind !== 'intentSet');
}

const slowLeft = (tool: ToolRt) => tool.statuses.find((s) => s.status === 'slow')?.remaining;

const summary = (events: readonly CombatEvent[]) => events.map((e) => [e.kind, e.src, e.dst, e.v]);

describe('enemy action verbs', () => {
  it('hit damages the agent through Guardrails', () => {
    const sim = setup();
    sim.agent.guard = 3;
    expect(summary(act(sim, [{ verb: 'hit', n: 7 }]))).toEqual([['damage', 'e1', 'a', 4]]);
    expect([sim.agent.guard, sim.agent.trust, sim.agent.taken]).toEqual([0, 36, 4]);
  });

  it('multiHit lands `times` separate hits', () => {
    const sim = setup();
    sim.agent.guard = 4;
    const hits = act(sim, [{ verb: 'multiHit', n: 3, times: 3 }]);
    expect(hits.map((e) => [e.kind, e.v])).toEqual([
      ['damage', 0],
      ['damage', 2],
      ['damage', 3],
    ]);
    expect(sim.agent.trust).toBe(35);
  });

  it('multiHit damage is phase-scaled per hit', () => {
    const sim = setup(2);
    act(sim, [{ verb: 'multiHit', n: 3, times: 2 }]); // floor(3 x 150 / 100) = 4 each
    expect(sim.agent.trust).toBe(32);
  });

  it('throttle hits the selected tools: fastest, tag, all', () => {
    const sim = setup();
    expect(summary(act(sim, [{ verb: 'throttle', sel: 'fastest', ms: 2000 }]))).toEqual([
      ['statusOn', 'e1', 't1', 2000],
    ]);
    // t1 is throttled now, so the fastest is t2.
    act(sim, [{ verb: 'throttle', sel: 'fastest', ms: 2000 }]);
    expect(sim.agent.tools.map((t) => hasStatus(t, 'throttle'))).toEqual([false, true, true]);
    const fresh = setup();
    act(fresh, [{ verb: 'throttle', sel: { tag: 'Edit' }, ms: 1000 }]);
    expect(fresh.agent.tools.map((t) => hasStatus(t, 'throttle'))).toEqual([false, true, false]);
    const all = setup();
    expect(act(all, [{ verb: 'throttle', sel: 'all', ms: 1000 }])).toHaveLength(3);
  });

  it('slow hits the leftmost or rightmost tool', () => {
    const sim = setup();
    act(sim, [{ verb: 'slow', sel: 'rightmost', ms: 1500 }]);
    act(sim, [{ verb: 'slow', sel: 'leftmost', ms: 500 }]);
    expect(sim.agent.tools.map(slowLeft)).toEqual([500, undefined, 1500]);
  });

  it('stun stops the agent (all of its tools)', () => {
    const sim = setup();
    expect(summary(act(sim, [{ verb: 'stun', ms: 1500 }]))).toEqual([
      ['statusOn', 'e1', 'a', 1500],
    ]);
    expect(hasStatus(sim.agent, 'stun')).toBe(true);
  });

  it('guard gives the acting enemy Guardrails, capped at its max Severity', () => {
    const sim = setup();
    expect(summary(act(sim, [{ verb: 'guard', n: 8 }]))).toEqual([['guard', 'e1', 'e1', 8]]);
    act(sim, [{ verb: 'guard', n: 100 }]);
    expect(enemyOf(sim).guard).toBe(50);
  });

  it('heal restores the acting enemy up to its max Severity', () => {
    const sim = setup();
    enemyOf(sim).sev = 40;
    expect(summary(act(sim, [{ verb: 'heal', n: 6 }]))).toEqual([['heal', 'e1', 'e1', 6]]);
    act(sim, [{ verb: 'heal', n: 30 }]);
    expect(enemyOf(sim).sev).toBe(50);
  });

  it('noise(n) calls the context hook with the enemy ref and raw n', () => {
    const sim = setup(2);
    const noise = vi.fn<ContextHooks['noise']>();
    const verbs: [Verb, Verb] = [
      { verb: 'hit', n: 1 },
      { verb: 'noise', n: 5 },
    ];
    expect(act(sim, verbs, { noise })).toHaveLength(1);
    expect(noise).toHaveBeenCalledExactlyOnceWith(sim, 'e1', 5);
    expect(act(setup(), [{ verb: 'noise', n: 5 }])).toEqual([]); // default hook: no-op
  });

  it('redirect and custom are not M1 verbs and do nothing', () => {
    const sim = setup();
    expect(act(sim, [{ verb: 'redirect' }, { verb: 'custom', handler: 'none' }])).toEqual([]);
    expect(sim.agent.trust).toBe(40);
  });
});
