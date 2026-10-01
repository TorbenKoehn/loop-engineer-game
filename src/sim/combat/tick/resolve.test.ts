import { describe, expect, it } from 'vitest';
import type { CombatEvent } from '../../events.ts';
import { fight, hitIntent, makeEnemy, makeTool } from '../../testing/builders.ts';
import type { CombatInput } from '../types.ts';
import { resolveCombat } from './resolve.ts';

const at = (events: readonly CombatEvent[], kind: CombatEvent['kind']) =>
  events.filter((e) => e.kind === kind).map((e) => e.t);

const grepVsTypo = () => fight({ tools: [makeTool({ id: 'grep' })], enemies: [makeEnemy()] });
const unbeatable = () =>
  fight({ trust: 30, enemies: [makeEnemy({ sev: 100_000, cycle: [hitIntent(10, 1000)] })] });
/** Nothing can end it but the hard cap: no tools, a passive enemy, both outlast Deadline damage. */
const stalled = () =>
  fight({
    tools: [],
    trust: 1000,
    enemies: [makeEnemy({ sev: 1000, cycle: [] })],
    deadlineMs: 1000,
  });

describe('resolveCombat walking skeleton', () => {
  it('one grep kills one Typo', () => {
    const input = fight({ tools: [makeTool({ id: 'grep' })], enemies: [makeEnemy()], speed: 100 });
    const result = resolveCombat(input);
    expect(result).toMatchObject({ outcome: 'win', reason: 'resolved', endT: 15_000 });
    expect(at(result.events, 'toolFired')).toEqual([3000, 6000, 9000, 12_000, 15_000]);
    expect(result.events.at(-2)).toMatchObject({ kind: 'resolved', src: 'e1', d: { by: 't0' } });
  });

  it('agent acts before enemies in the same tick', () => {
    const result = resolveCombat(grepVsTypo());
    // Nitpick would also land at 15 000 ms, the tick in which grep resolves the Typo.
    expect(at(result.events, 'enemyActed')).toEqual([3000, 6000, 9000, 12_000]);
    expect(result.agentAfter.trust).toBe(32);
    expect(result.stats).toEqual({ toolDamage: [30], damageTaken: 8 });
  });

  it('agent loses to an unbeatable enemy', () => {
    const result = resolveCombat(unbeatable());
    expect(result).toMatchObject({ outcome: 'loss', reason: 'trust', endT: 3000 });
    expect(result.agentAfter.trust).toBe(0);
    expect(result.events.at(-1)).toMatchObject({ kind: 'fightEnd', d: { reason: 'trust' } });
  });

  it('a stalled fight ends by timeout 30 000 ms after the Deadline', () => {
    const result = resolveCombat(stalled());
    expect(result).toMatchObject({ outcome: 'loss', reason: 'timeout', endT: 31_000 });
  });

  it('charge rate scales the cooldown: rate 200 fires grep every 1500 ms', () => {
    const result = resolveCombat(fight({ speed: 200, enemies: [makeEnemy({ sev: 12 })] }));
    expect(at(result.events, 'toolFired')).toEqual([1500, 3000]);
  });

  it('hits the front enemy first, uses the tool version and resolves enemies front to back', () => {
    const typos = [makeEnemy({ sev: 9 }), makeEnemy({ sev: 9 })];
    const result = resolveCombat(fight({ version: 2, enemies: typos }));
    const hits = result.events.filter((e) => e.kind === 'damage' && e.src === 't0');
    expect(hits.map((e) => [e.t, e.dst, e.v])).toEqual([
      [3000, 'e1', 9],
      [6000, 'e2', 9],
    ]);
    expect(result.events.filter((e) => e.kind === 'resolved').map((e) => e.src)).toEqual([
      'e1',
      'e2',
    ]);
  });

  it('discards overkill and skips damage when no enemy is left', () => {
    const tools = [makeTool(), makeTool({ id: 'cat', effects: [{ do: 'dmg', v: 50 }] })];
    const result = resolveCombat(fight({ tools, enemies: [makeEnemy({ sev: 4 })] }));
    const hits = result.events.filter((e) => e.kind === 'damage');
    expect(hits).toHaveLength(1);
    expect(hits[0]).toMatchObject({ v: 4, d: { base: 6, sev: 0 } });
  });
});

describe('event log invariants', () => {
  const inputs: [string, () => CombatInput][] = [
    ['win', grepVsTypo],
    ['loss', unbeatable],
    ['timeout', stalled],
  ];

  it.each(inputs)(
    '%s: seq from 0, t on the tick grid, fightStart first, fightEnd last',
    (_, make) => {
      const { events, endT } = resolveCombat(make());
      expect(events.map((e) => e.seq)).toEqual(events.map((_e, i) => i));
      expect(events.every((e) => e.t % 50 === 0)).toBe(true);
      expect(events.every((e, i) => i === 0 || e.t >= (events[i - 1]?.t ?? 0))).toBe(true);
      expect(events[0]?.kind).toBe('fightStart');
      expect(events.at(-1)).toMatchObject({ kind: 'fightEnd', v: endT });
      expect(at(events, 'fightStart')).toHaveLength(1);
      expect(at(events, 'fightEnd')).toHaveLength(1);
    },
  );

  it.each(inputs)('%s: log false keeps outcome and endT with no events', (_, make) => {
    const logged = resolveCombat(make());
    const silent = resolveCombat(make(), { log: false });
    expect(silent.events).toEqual([]);
    expect(silent).toMatchObject({ outcome: logged.outcome, reason: logged.reason });
    expect(silent.endT).toBe(logged.endT);
  });

  it('same input twice gives identical results', () => {
    const input = fight({ seed: 'K7Q2-M9XA', enemies: [makeEnemy(), makeEnemy()] });
    expect(resolveCombat(input)).toEqual(resolveCombat(input));
  });
});
