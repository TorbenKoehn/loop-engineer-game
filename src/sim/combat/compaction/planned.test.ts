import { describe, expect, it } from 'vitest';
import type { ToolDef } from '../../../content/types/index.ts';
import { fight, makeRule, makeSkill, makeTool, withSkills } from '../../testing/builders.ts';
import { injectNoise } from '../context/noise.ts';
import { updateZone } from '../context/zone.ts';
import { createSim, PROGRESS_PER_MS, type Sim, type ToolRt } from '../state.ts';
import { applyStatus, hasStatus } from '../status/statuses.ts';
import { fireTools } from '../tick/fire.ts';
import { resolveCombat } from '../tick/resolve.ts';
import type { CombatInput } from '../types.ts';
import { PLANNED_COMPACT_LOCKOUT_MS, PLANNED_COMPACT_STUN_MS, policyOff } from './compaction.ts';

type Policy = CombatInput['policy'];

/** Weightless tools: B = 20 (the harness), W 60 unless overridden. */
const tool = (id: string, output: number, over: Partial<ToolDef> = {}) =>
  makeTool({ id, output, weight: 0, ...over });

function sim(tools: ToolDef[], policy: Policy, S = 20, window = 60): Sim {
  const s = createSim({ ...fight({ tools, window }), policy }, true);
  s.agent.ctx.S = S;
  updateZone(s);
  s.events.length = 0;
  return s;
}

const at = (s: Sim, slot: number): ToolRt => {
  const t = s.agent.tools[slot];
  if (!t) throw new Error(`no tool ${slot}`);
  return t;
};
/** Fills tool `slot` and runs tick step 4. */
const fire = (s: Sim, slot: number) => {
  const t = at(s, slot);
  t.progress = t.def.cooldownMs * PROGRESS_PER_MS;
  fireTools(s);
};
const compactions = (s: Sim) => s.events.filter((e) => e.kind === 'compaction');

describe('planned compaction', () => {
  it('policy 80 compacts at 80% (worked example)', () => {
    const six = tool('six', 6, { tags: ['Test'] }); // 2 [Search]: no Indexed breakpoint
    const s = sim([tool('cat', 1), tool('big', 15), six], 80);
    const [enemy] = s.enemies;
    if (!enemy) throw new Error('setup');
    fire(s, 0); // cat: F 21
    injectNoise(s, enemy, 6); // Context Drift: F 27, N 6
    fire(s, 1); // F 42: 70%, Rot
    expect(s.agent.ctx).toMatchObject({ S: 36, N: 6, zone: 'rot' });
    expect(compactions(s)).toEqual([]);
    applyStatus(s, 't0', at(s, 0), { status: 'haste', ms: 3000 });
    fire(s, 2); // F 48: 80%
    expect(compactions(s)).toEqual([
      expect.objectContaining({
        src: 'ctx',
        v: PLANNED_COMPACT_STUN_MS,
        d: { kind: 'planned', S: 26 },
      }),
    ]);
    expect(s.agent.ctx).toMatchObject({ S: 26, N: 0, zone: 'focused' });
    expect(s.agent.statuses).toMatchObject([{ status: 'stun', remaining: 1000 }]);
    expect(hasStatus(at(s, 0), 'haste')).toBe(true); // buffs are kept
  });

  it('orders tokens, compaction, Stun, zoneChanged; tools after it still fire this tick', () => {
    const s = sim([tool('a', 4), tool('b', 1)], 80, 44);
    for (const t of s.agent.tools) t.progress = t.def.cooldownMs * PROGRESS_PER_MS;
    fireTools(s);
    const kinds = s.events.map((e) => e.kind).filter((k) => k !== 'damage');
    expect(kinds).toEqual([
      ...['toolFired', 'tokens', 'compaction', 'statusOn', 'zoneChanged'], // a: F 48
      ...['toolFired', 'tokens'], // b: F 27, locked out
    ]);
  });
});

describe('lockout', () => {
  it('no planned compaction within 3000 ms of the last one', () => {
    const s = sim([tool('big', 22)], 80, 26); // each activation: 26 + 22 = 48 (80%)
    fire(s, 0);
    expect(compactions(s).length).toBe(1);
    s.t += PLANNED_COMPACT_LOCKOUT_MS - 50;
    fire(s, 0);
    expect(compactions(s).length).toBe(1);
    expect(s.agent.ctx.S).toBe(48);
    s.t += 50;
    s.agent.ctx.S = 26;
    fire(s, 0);
    expect(compactions(s).map((e) => [e.t, e.d.kind])).toEqual([
      [0, 'planned'],
      [3000, 'planned'],
    ]);
  });

  it('an auto-compaction starts the lockout too', () => {
    const s = sim([tool('big', 34), tool('mid', 22)], 80, 26);
    fire(s, 0); // F 60: auto at t 0, S 26
    s.t = 2950;
    fire(s, 1); // F 48 = 80%, locked out
    expect(compactions(s).map((e) => e.d.kind)).toEqual(['auto']);
    s.agent.ctx.S = 26;
    s.t = 3000;
    fire(s, 1);
    expect(compactions(s).map((e) => e.d.kind)).toEqual(['auto', 'planned']);
  });

  it('the addition that auto-compacts never compacts planned as well', () => {
    const s = sim([tool('big', 20)], 90, 45); // 65 >= 60
    fire(s, 0);
    expect(compactions(s).map((e) => e.d.kind)).toEqual(['auto']);
  });

  it('only an addition triggers it: a removal above the threshold does not', () => {
    const s = sim([tool('rm', -1)], 80, 50);
    fire(s, 0);
    expect(s.agent.ctx.S).toBe(49);
    expect(compactions(s)).toEqual([]);
  });
});

describe('disabled policy', () => {
  // (B + floor(W x 10 / 100)) x 100 >= W x p: B 36 + 6 = 42 hits 70% of 60, B 35 does not
  const start = (weight: number, policy: Policy) => {
    const input = { ...fight({ tools: [makeTool({ weight })] }), policy };
    return resolveCombat(input).events[0];
  };

  it('fightStart flags a looping policy for the UI', () => {
    expect(start(16, 70)?.d).toMatchObject({ B: 36, policyOff: 1 });
    expect(start(15, 70)?.d).not.toHaveProperty('policyOff');
    expect(start(16, 80)?.d).not.toHaveProperty('policyOff');
    expect(start(30, 0)?.d).not.toHaveProperty('policyOff'); // never is not a warning
  });

  it('policyOff uses integer math on W x p', () => {
    const s = sim([], 90, 20, 45); // reset base 20 + 4 = 24: 2400 < 4050
    expect(policyOff(s.agent.ctx)).toBe(false);
    expect(policyOff({ ...s.agent.ctx, B: 37 })).toBe(true); // 4100 >= 4050
    expect(policyOff({ ...s.agent.ctx, B: 36 })).toBe(false); // 4000 < 4050
  });

  it('a disabled policy never compacts', () => {
    const s = sim([tool('a', 4, { weight: 16 })], 70, 50); // B 36
    fire(s, 0); // F 54 = 90%
    expect(compactions(s)).toEqual([]);
  });
});

describe('policy never and the compact effect', () => {
  it('policy 0 never compacts below W', () => {
    const s = sim([tool('a', 9)], 0, 50);
    fire(s, 0); // F 59 of 60
    expect(compactions(s)).toEqual([]);
  });

  it('compact ignores policy and lockout: kind tool, Stun 1000 ms, buffs kept', () => {
    const compact = tool('compact', 0, { effects: [{ do: 'compact' }] });
    const s = sim([compact], 0, 30);
    s.agent.ctx.N = 5;
    s.agent.ctx.lastCompactT = 0;
    applyStatus(s, 't0', at(s, 0), { status: 'haste', ms: 3000 });
    s.t = 100;
    fire(s, 0);
    expect(compactions(s)).toEqual([
      expect.objectContaining({ t: 100, v: 1000, d: { kind: 'tool', S: 26 } }),
    ]);
    expect(s.agent.ctx).toMatchObject({ S: 26, N: 0, lastCompactT: 100 });
    expect(s.agent.statuses).toMatchObject([{ status: 'stun', remaining: 1000 }]);
    expect(hasStatus(at(s, 0), 'haste')).toBe(true);
  });

  it('compact as an item rule effect raises compaction rules', () => {
    const guard = makeRule({ on: 'compaction' }, [{ do: 'guard', v: 8 }]);
    const runbook = makeRule({ on: 'fightStart' }, [{ do: 'compact' }]);
    const input = withSkills(fight(), makeSkill('runbook', runbook), makeSkill('sum', guard));
    const { events } = resolveCombat(input);
    const kinds = events.filter((e) => e.t === 0).map((e) => e.kind);
    expect(kinds).toContain('compaction');
    expect(kinds.indexOf('guard')).toBeGreaterThan(kinds.indexOf('compaction'));
  });
});
