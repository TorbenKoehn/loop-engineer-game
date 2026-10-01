// T032: every trigger kind fires its rule at the right moment; ordering, recursion, oncePerRun.
import { describe, expect, it } from 'vitest';
import type { Effect, Rule, Trigger } from '../../../content/types/index.ts';
import type { CombatEvent } from '../../events.ts';
import {
  fight,
  hitIntent,
  makeEnemy,
  makeRule,
  makeSkill,
  makeTool,
  withSkills,
} from '../../testing/builders.ts';
import { resolveCombat } from '../resolve.ts';
import type { CombatInput } from '../types.ts';

const guard = (v: number): Effect => ({ do: 'guard', v });
/** Rule effects come from the agent: src `a`. */
const ruled = (events: readonly CombatEvent[], kind: CombatEvent['kind'] = 'guard') =>
  events.filter((e) => e.kind === kind && e.src === 'a');
const run = (input: CombatInput, ...rules: Rule[]) =>
  resolveCombat(withSkills(input, makeSkill('s', ...rules)));
const on = (when: Trigger, v = 1) => makeRule(when, [guard(v)]);
const lint = makeTool({ id: 'lint', tags: ['Test'], target: 'self', effects: [guard(5)] });

describe('fightStart', () => {
  it('runs at t = 0 in slot order, before the first tick', () => {
    const input = withSkills(
      fight(),
      makeSkill('a', on({ on: 'fightStart' }, 3)),
      makeSkill('b', on({ on: 'fightStart' }, 5)),
    );
    const { events } = resolveCombat(input);
    const guards = ruled(events);
    // Item effects are flat: no Focused bonus.
    expect(guards.slice(0, 2)).toMatchObject([
      { t: 0, dst: 'a', v: 3 },
      { t: 0, v: 5 },
    ]);
    const firstTick = events.findIndex((e) => e.t > 0);
    expect(events.indexOf(guards[1] as CombatEvent)).toBeLessThan(firstTick);
    expect(events.indexOf(guards[0] as CombatEvent)).toBeGreaterThan(0); // after fightStart
  });
});

describe('fightWon', () => {
  it('runs after the last enemy is resolved, before fightEnd; never on a loss', () => {
    const won = run(fight(), on({ on: 'fightWon' }, 7));
    expect(won.events.slice(-3).map((e) => e.kind)).toEqual(['resolved', 'guard', 'fightEnd']);
    expect(ruled(won.events)).toMatchObject([{ t: won.endT, v: 7 }]);
    const lost = run(fight({ tools: [] }), on({ on: 'fightWon' }));
    expect(lost.outcome).toBe('loss');
    expect(ruled(lost.events)).toEqual([]);
  });
});

describe('every', () => {
  it('runs at each multiple of ms in tick step 2, before the tools fire', () => {
    const { events } = run(fight(), on({ on: 'every', ms: 1000 }));
    expect(
      ruled(events)
        .map((e) => e.t)
        .slice(0, 3),
    ).toEqual([1000, 2000, 3000]);
    const at3000 = events.filter((e) => e.t === 3000).map((e) => e.kind);
    expect(at3000.indexOf('guard')).toBeLessThan(at3000.indexOf('toolFired'));
  });
});

describe('toolFired', () => {
  it('matches by tag, by tool id or any tool', () => {
    const count = (when: Trigger) => ruled(run(fight(), on(when)).events).length;
    expect(count({ on: 'toolFired', tag: 'Search' })).toBe(5); // grep fires 5 times
    expect(count({ on: 'toolFired', tool: 'grep' })).toBe(5);
    expect(count({ on: 'toolFired' })).toBe(5);
    expect(count({ on: 'toolFired', tag: 'Edit' })).toBe(0);
    expect(count({ on: 'toolFired', tool: 'sed' })).toBe(0);
  });
});

describe('when X fires: after effects and output, before the compaction check', () => {
  it('orders toolFired, damage, tokens, rule effects, compaction', () => {
    // W 40, B 23, output 10: the second activation overflows.
    const input = fight({ window: 40, tools: [makeTool({ output: 10 })] });
    const { events } = run(input, on({ on: 'toolFired' }));
    const kinds = events.map((e) => e.kind);
    const fired = kinds.lastIndexOf('toolFired', kinds.indexOf('compaction'));
    expect(kinds.slice(fired, fired + 5)).toEqual([
      'toolFired',
      'damage',
      'tokens',
      'guard',
      'compaction',
    ]);
  });
});

describe('compaction', () => {
  it('runs after the compaction and its lost buff, so its own Haste survives', () => {
    const input = fight({ window: 40, tools: [makeTool({ output: 10 })] });
    const haste: Effect = { do: 'status', status: 'haste', ms: 2000, sel: 'leftmost' };
    const { events } = run(input, makeRule({ on: 'compaction' }, [guard(8), haste]));
    const compaction = events.find((e) => e.kind === 'compaction');
    const guards = ruled(events);
    expect(guards[0]).toMatchObject({ t: compaction?.t, v: 8 });
    expect(guards[0]?.seq).toBeGreaterThan(compaction?.seq ?? Infinity);
    expect(ruled(events, 'statusOn')[0]).toMatchObject({ t: compaction?.t, dst: 't0', v: 2000 });
    expect(events.some((e) => e.kind === 'statusOff' && e.src === 'ctx')).toBe(false);
  });
});

describe('damaged', () => {
  const hitBy = (n: number) =>
    fight({ tools: [], enemies: [makeEnemy({ cycle: [hitIntent(n, 3000)] })] });

  it('runs after an enemy hit of at least min', () => {
    const { events } = run(hitBy(5), on({ on: 'damaged', min: 5 }));
    const at3000 = events.filter((e) => e.t === 3000).map((e) => e.kind);
    expect(at3000.indexOf('guard')).toBe(at3000.indexOf('damage') + 1);
  });

  it('ignores smaller hits and Deadline damage', () => {
    expect(ruled(run(hitBy(4), on({ on: 'damaged', min: 5 })).events)).toEqual([]);
    const late = fight({ tools: [], enemies: [makeEnemy({ cycle: [] })], deadlineMs: 1000 });
    expect(ruled(run(late, on({ on: 'damaged' })).events)).toEqual([]);
  });
});

describe('guardGained', () => {
  const dmg: Effect = { do: 'dmg', v: 1 };

  it('fromTool: runs after the giving tool activation, not when an item gives any', () => {
    const rules = [
      makeRule({ on: 'guardGained', fromTool: true }, [dmg]),
      on({ on: 'fightStart' }),
    ];
    const { events } = run(fight({ tools: [lint] }), ...rules);
    const hits = ruled(events, 'damage');
    expect(hits[0]).toMatchObject({ t: 3000, dst: 'e1' });
    const at3000 = events.filter((e) => e.t === 3000).map((e) => e.kind);
    expect(at3000.slice(0, 4)).toEqual(['toolFired', 'guard', 'tokens', 'damage']);
    expect(ruled(events)[0]).toMatchObject({ t: 0 }); // the item's guard at fight start ...
    expect(hits.filter((e) => e.t === 0)).toEqual([]); // ... does not count
  });

  it('any source: an item giving Guardrails counts too', () => {
    const rules = [makeRule({ on: 'guardGained' }, [dmg]), on({ on: 'fightStart' })];
    expect(ruled(run(fight({ tools: [] }), ...rules).events, 'damage')[0]).toMatchObject({ t: 0 });
  });
});

describe('trustBelow', () => {
  it('runs after a hit leaves Trust below pct of max', () => {
    // Trust 40, hits of 10: 30, 20 (exactly 50%), 10.
    const input = fight({ tools: [], enemies: [makeEnemy({ cycle: [hitIntent(10, 3000)] })] });
    const { events } = run(input, on({ on: 'trustBelow', pct: 50 }));
    expect(ruled(events)[0]).toMatchObject({ t: 9000 });
  });
});

describe('passive', () => {
  it('is never dispatched as an event rule (passive mods: T033)', () => {
    expect(ruled(run(fight(), on({ on: 'passive' })).events)).toEqual([]);
  });
});

describe('recursion guard', () => {
  it('a rule never sees triggers raised by its own effects', () => {
    const { events } = run(fight({ tools: [lint] }), on({ on: 'guardGained' }, 3));
    const at3000 = events.filter((e) => e.t === 3000 && e.kind === 'guard');
    expect(at3000).toMatchObject([{ src: 't0' }, { src: 'a', v: 3 }]);
  });

  it('two rules triggering each other stop once each is in the chain', () => {
    const input = withSkills(
      fight({ tools: [lint] }),
      makeSkill('a', on({ on: 'guardGained' })),
      makeSkill('b', on({ on: 'guardGained' })),
    );
    const at3000 = ruled(resolveCombat(input).events).filter((e) => e.t === 3000);
    expect(at3000).toHaveLength(4); // a, b, then b after a's guard, a after b's
  });
});

describe('oncePerRun', () => {
  it('returns used rule ids in agentAfter.usedOncePerRun and skips them next fight', () => {
    const once = makeRule({ on: 'fightStart' }, [guard(5)], [{ if: 'oncePerRun' }]);
    const first = run(fight(), once);
    expect(first.agentAfter.usedOncePerRun).toEqual(['skill:s#0']);
    expect(ruled(first.events)).toHaveLength(1);
    const used = fight();
    const next = { ...used, agent: { ...used.agent, usedOncePerRun: ['skill:s#0'] } };
    const second = run(next, once);
    expect(ruled(second.events)).toEqual([]);
    expect(second.agentAfter.usedOncePerRun).toEqual(['skill:s#0']);
  });
});
