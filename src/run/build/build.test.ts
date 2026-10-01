import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { Action } from '../actions.ts';
import { apply, legalActions } from '../apply.ts';
import { newRun } from '../new-run.ts';
import type { AgentState, Mode, OwnedItem, OwnedTool, RunState } from '../state.ts';
import { type BuildAction, buildActions } from './build.ts';
import { LIMIT_PCT, selectBaseline, selectWindow } from './selectors.ts';

const META = { unlocked: [], lessons: ['bugs_off'], lintCap: 0 };

function step(state: RunState, action: Action): RunState {
  const r = apply(state, action);
  if (!r.ok) throw new Error(`rejected ${JSON.stringify(action)}: ${r.error}`);
  return r.state;
}

function onMap(prompt = 'senior', seed = 'K7Q2-M9XA'): RunState {
  const start = newRun({ seed, harness: 'terminal_purist', lint: [], tutorial: false }, META);
  return step(start, { t: 'pickPrompt', prompt });
}

const tool = (id: string): OwnedTool => ({ id, version: 1, weightMod: 0 });
const stashTool = (id: string): OwnedItem => ({ kind: 'tool', tool: tool(id) });
const withAgent = (s: RunState, agent: Partial<AgentState>): RunState => ({
  ...s,
  agent: { ...s.agent, ...agent },
});
const ids = (s: RunState) => s.agent.tools.map((t) => t.id);
const stashIds = (s: RunState) => s.agent.stash.map((i) => (i.kind === 'tool' ? i.tool.id : i.id));
const within = (s: RunState) => selectBaseline(s) * 100 <= selectWindow(s) * LIMIT_PCT;

describe('build actions', () => {
  // terminal_purist + senior: W 50, limit B 40; grep cat sed, unix_philosophy, 1 lesson: B 25.
  const base = withAgent(onMap(), {
    stash: [stashTool('run_tests'), { kind: 'skill', id: 'lockfile' }],
  });

  it.each<Mode>(['map', 'reward', 'shop', 'event'])('are legal in %s mode', (mode) => {
    let s: RunState = { ...base, mode };
    s = step(s, { t: 'moveTool', from: 0, to: 2 });
    expect(ids(s)).toEqual(['cat', 'sed', 'grep']);
    s = step(s, { t: 'unequip', kind: 'tool', slot: 1 });
    expect([ids(s), stashIds(s)]).toEqual([
      ['cat', 'grep'],
      ['run_tests', 'lockfile', 'sed'],
    ]);
    s = step(s, { t: 'equip', stashIx: 0, slot: 1 });
    expect([ids(s), stashIds(s)]).toEqual([
      ['cat', 'run_tests', 'grep'],
      ['lockfile', 'sed'],
    ]);
    s = step(s, { t: 'swap', stashIx: 0, slot: 0 });
    expect([s.agent.skills, stashIds(s)]).toEqual([['lockfile'], ['unix_philosophy', 'sed']]);
    s = step(s, { t: 'unequip', kind: 'skill', slot: 0 });
    expect([s.agent.skills, stashIds(s)]).toEqual([[], ['unix_philosophy', 'sed', 'lockfile']]);
    expect([s.mode, s.pending]).toEqual([mode, base.pending]);
  });

  it.each<Mode>(['combatReview', 'rest', 'treasure', 'discard', 'runEnd', 'promptPick'])(
    'are refused in %s mode',
    (mode) => {
      const s: RunState = { ...base, mode };
      for (const a of [
        { t: 'moveTool', from: 0, to: 1 },
        { t: 'equip', stashIx: 0, slot: 3 },
        { t: 'unequip', kind: 'tool', slot: 0 },
        { t: 'swap', stashIx: 0, slot: 0 },
        { t: 'setPolicy', policy: 70 },
      ] as const) {
        expect(apply(s, a)).toEqual({ ok: false, error: 'wrongMode' });
      }
    },
  );

  it('refuses bad indices, full slots, a full stash and the last tool', () => {
    const fail = (s: RunState, a: Action) => {
      const r = apply(s, a);
      return r.ok ? 'ok' : r.error;
    };
    expect(fail(base, { t: 'moveTool', from: 0, to: 3 })).toBe('notOffered');
    expect(fail(base, { t: 'equip', stashIx: 2, slot: 0 })).toBe('notOffered');
    expect(fail(base, { t: 'equip', stashIx: 0, slot: 4 })).toBe('notOffered');
    expect(fail(base, { t: 'equip', stashIx: 0, slot: 1.5 })).toBe('notOffered');
    expect(fail(base, { t: 'unequip', kind: 'memory', slot: 0 })).toBe('notOffered');
    expect(fail(base, { t: 'swap', stashIx: 0, slot: 3 })).toBe('notOffered');
    const fullSkills = withAgent(base, { slots: { ...base.agent.slots, skills: 1 } });
    expect(fail(fullSkills, { t: 'equip', stashIx: 1, slot: 0 })).toBe('notOffered');
    const fullStash = withAgent(base, { slots: { ...base.agent.slots, stash: 2 } });
    expect(fail(fullStash, { t: 'unequip', kind: 'tool', slot: 0 })).toBe('notOffered');
    const one = withAgent(base, { tools: [tool('grep')] });
    expect(fail(one, { t: 'unequip', kind: 'tool', slot: 0 })).toBe('lastTool');
  });

  it('setPolicy accepts 70, 80, 90 and 0 only', () => {
    for (const policy of [70, 80, 90, 0] as const) {
      expect(step(base, { t: 'setPolicy', policy }).agent.policy).toBe(policy);
    }
    for (const policy of [50, 100, 85, -1]) {
      const a = { t: 'setPolicy', policy } as unknown as Action;
      expect(apply(base, a)).toEqual({ ok: false, error: 'notOffered' });
    }
  });
});

describe('baseline limit', () => {
  // grep cat sed + run_tests brute_force read_file: B 25 + 15 = 40 = 80% of W 50.
  const heavy = (prompt: string) =>
    withAgent(onMap(prompt), {
      tools: ['grep', 'cat', 'sed', 'run_tests', 'brute_force', 'read_file'].map(tool),
      stash: [
        { kind: 'skill', id: 'lockfile' },
        { kind: 'memory', id: 'long_context' },
        stashTool('lint'),
        stashTool('autocomplete'),
      ],
    });
  const senior = heavy('senior');
  const err = (s: RunState, a: Action) => {
    const r = apply(s, a);
    return r.ok ? 'ok' : r.error;
  };

  it('allows B x 100 = W x 80 and refuses B x 100 > W x 80', () => {
    expect([selectBaseline(senior), selectWindow(senior)]).toEqual([40, 50]);
    expect(err(senior, { t: 'equip', stashIx: 0, slot: 1 })).toBe('baselineOverLimit');
    expect(err(senior, { t: 'swap', stashIx: 2, slot: 0 })).toBe('ok'); // lint 3 for grep 3
    expect(err(senior, { t: 'swap', stashIx: 2, slot: 1 })).toBe('baselineOverLimit'); // for cat 2
    expect(err(senior, { t: 'swap', stashIx: 3, slot: 1 })).toBe('ok'); // autocomplete 2 for cat 2
  });

  it('uses the modified window: prompt and memory window mods', () => {
    // concise has no window mod: W 60, B 36 + lockfile 2 fits.
    expect(err(heavy('concise'), { t: 'equip', stashIx: 0, slot: 1 })).toBe('ok');
    // long_context (+40 window, weight 0) makes room for lockfile ...
    const roomy = step(senior, { t: 'equip', stashIx: 1, slot: 0 });
    expect(selectWindow(roomy)).toBe(90);
    const packed = step(roomy, { t: 'equip', stashIx: 0, slot: 1 });
    expect(selectBaseline(packed)).toBe(42);
    // ... and cannot be unequipped while the loadout needs it.
    expect(err(packed, { t: 'unequip', kind: 'memory', slot: 0 })).toBe('baselineOverLimit');
  });

  it('gains equip only within the limit, else stash; sells and discards keep it', () => {
    const roomy = step(senior, { t: 'equip', stashIx: 1, slot: 0 });
    const packed = step(roomy, { t: 'equip', stashIx: 0, slot: 1 });
    const shop: RunState = {
      ...packed,
      mode: 'shop',
      pending: { kind: 'shop', node: 'p1-r1-c0', rerolls: 0, offers: [] },
    };
    expect(err(shop, { t: 'sell', item: { at: 'memory', ix: 0 } })).toBe('baselineOverLimit');
    const discard: RunState = {
      ...packed,
      mode: 'discard',
      pending: { kind: 'discard', item: { kind: 'memory', id: 'cache' }, next: 'map' },
    };
    expect(err(discard, { t: 'discardItem', item: { at: 'memory', ix: 0 } })).toBe('notOffered');
    expect(legalActions(discard)).not.toContainEqual({
      t: 'discardItem',
      item: { at: 'memory', ix: 0 },
    });
  });
});

describe('build properties', () => {
  // A heavy stash makes over-limit equips likely; rewards, shop and events gain more.
  const start = (seed: string) =>
    withAgent(onMap('senior', seed), {
      credits: 60,
      stash: [
        stashTool('run_tests'),
        stashTool('brute_force'),
        { kind: 'memory', id: 'long_context' },
        { kind: 'skill', id: 'feedback_loop' },
      ],
    });

  const tried = { build: 0, refused: 0 };

  /** Two of three picks take a build action, else a legalActions one; `p` also picks it. */
  function randomStep(s: RunState, p: number): RunState {
    const build: readonly BuildAction[] = p % 3 ? buildActions(s) : [];
    const pool: readonly Action[] = build.length ? build : legalActions(s);
    const next = step(s, pool[Math.floor(p / 3) % pool.length] as Action);
    if (pool === build) probeEquip(next, p % 4);
    return next;
  }

  /** An equip attempt is refused when over the limit, never applied. */
  function probeEquip(s: RunState, stashIx: number): void {
    tried.build++;
    const r = apply(s, { t: 'equip', stashIx, slot: 0 });
    if (!r.ok && r.error === 'baselineOverLimit') tried.refused++;
    if (r.ok) expect(within(r.state)).toBe(true);
  }

  it('baseline <= 80% of W after every build action over random sequences', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 12 }),
        fc.array(fc.nat(), { minLength: 1, maxLength: 40 }),
        (seed, ps) => {
          let s = start(seed);
          // Every action is checked, not only build actions: gains, sells and discards too.
          for (let n = 0; n < 150 && legalActions(s).length > 0; n++) {
            s = randomStep(s, ps[n % ps.length] as number);
            expect(within(s)).toBe(true);
          }
        },
      ),
      { numRuns: 40 },
    );
    expect(tried.build).toBeGreaterThan(100);
    expect(tried.refused).toBeGreaterThan(0);
  });

  it('buildActions lists only actions apply accepts', () => {
    const s = start('K7Q2-M9XA');
    const all = buildActions(s);
    expect(all.map((a) => a.t)).toEqual(expect.arrayContaining(['moveTool', 'equip', 'swap']));
    for (const a of all) expect(apply(s, a).ok).toBe(true);
    expect(buildActions({ ...s, mode: 'rest' })).toEqual([]);
  });
});
