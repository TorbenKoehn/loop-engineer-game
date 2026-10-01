// T037: the handler registry and the monolith_stage handler (phase-1-implement.md "Boss:
// Legacy Monolith"). The hooks are tested in combat/mods/custom.test.ts and
// combat/enemy/traits.test.ts; real content in src/run/boss.test.ts.
import { describe, expect, it } from 'vitest';
import type { EnemyDef } from '../../content/types/index.ts';
import { resolveCombat } from '../combat/resolve.ts';
import type { CombatEvent } from '../events.ts';
import { fight, hitIntent, makeEnemy, makeTool } from '../testing/builders.ts';
import { enemyHandler, HANDLER_IDS, HANDLERS } from './index.ts';
import { switchStage } from './stage.ts';

const a = [hitIntent(1, 2000, 'a1'), hitIntent(1, 2000, 'a2')];
const b = [hitIntent(1, 2000, 'b1'), hitIntent(1, 2000, 'b2'), hitIntent(1, 2000, 'b3')];
const boss: EnemyDef = makeEnemy({
  id: 'monolith',
  sev: 1000,
  traits: [{ trait: 'armor', layers: 3, hp: 50 }],
  cycle: a,
  stages: [
    { id: 'a', layers: [3, 3], cycle: a },
    { id: 'b', layers: [1, 2], cycle: b },
    { id: 'c', layers: [0, 0], cycle: [hitIntent(1, 1000, 'c1')] },
  ],
  handler: 'monolith_stage',
});
// One Edit hit of 50 breaks a layer: at 3000, 6000 and 9000 ms.
const sed = makeTool({ id: 'sed', tags: ['Edit'], effects: [{ do: 'dmg', v: 50 }] });
const { events } = resolveCombat({ ...fight({ tools: [sed], enemies: [boss] }), policy: 0 });

/** The boss's intents and stage switches in log order, with t and the log index. */
const timeline = events.flatMap((e: CombatEvent, i) => {
  if (e.kind === 'intentSet') return [{ i, t: e.t, what: `set ${e.d.intent}@${e.d.ix}` }];
  if (e.kind === 'enemyActed') return [{ i, t: e.t, what: `act ${e.d.intent}` }];
  if (e.kind === 'trait') return [{ i, t: e.t, what: `stage ${e.d.what} (${e.v})` }];
  return e.kind === 'armorBroken' ? [{ i, t: e.t, what: `break ${e.d.remaining}` }] : [];
});
const between = (from: number, to: number) =>
  timeline.filter((x) => x.t >= from && x.t < to).map((x) => x.what);

describe('handler registry', () => {
  it('registers monolith_stage and the six passive hooks used by M1 content', () => {
    expect([...HANDLER_IDS].sort()).toEqual([
      'context_noise_cut',
      'double_first_resolve',
      'feedback_loop',
      'monolith_stage',
      'rot_no_slow',
      'throttle_shorter',
      'web_ignores_outage',
    ]);
    expect(HANDLER_IDS.size).toBeLessThanOrEqual(10);
  });

  it('enemyHandler resolves only enemy handlers', () => {
    expect(enemyHandler('monolith_stage')).toBe(switchStage);
    expect(HANDLERS.monolith_stage.kind).toBe('enemy');
    expect([
      enemyHandler('double_first_resolve'),
      enemyHandler('nope'),
      enemyHandler(undefined),
    ]).toEqual([undefined, undefined, undefined]);
  });
});

describe('monolith_stage', () => {
  it('stage A: the boss opens on the stage A cycle in order while all 3 layers hold', () => {
    expect(between(0, 3000)).toEqual(['set a1@0', 'act a1', 'set a2@1']);
  });

  it('stage B: after the first break the current intent finishes, then B starts at index 0', () => {
    // The break stuns the boss 1500 ms; a2 acts after the stun, then the switch happens.
    expect(between(3000, 6000)).toEqual(['break 2', 'act a2', 'stage b (2)', 'set b1@0']);
    expect(between(6000, 9000)).toEqual(['break 1', 'act b1', 'set b2@1']); // B covers 1-2
  });

  it('stage C: at 0 layers the next intent starts the stage C cycle at index 0', () => {
    const c = timeline.find((x) => x.what === 'stage c (0)');
    const after = timeline.filter((x) => x.i >= (c?.i ?? 0)).slice(0, 4);
    expect(after.map((x) => x.what)).toEqual(['stage c (0)', 'set c1@0', 'act c1', 'set c1@0']);
    const broken = timeline.filter((x) => x.what === 'break 0');
    expect(broken.map((x) => x.t)).toEqual([9000]);
  });

  it('without armor or stages the handler changes nothing', () => {
    const plain = { ...boss, traits: [], stages: undefined };
    const log = resolveCombat(fight({ tools: [], enemies: [plain], deadlineMs: 5000 })).events;
    expect(log.filter((e) => e.kind === 'trait')).toEqual([]);
  });
});
