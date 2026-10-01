import { describe, expect, it } from 'vitest';
import { en } from '../strings/en.ts';
import { describeEnemy } from '../text.ts';
import type { EnemyDef, Intent } from '../types/enemy.ts';
import { enemies } from './index.ts';
import { monolithEnemies } from './legacy-monolith.ts';
import { phase1Enemies } from './phase1.ts';
import { yakShaveEnemies } from './yak-shave.ts';

const byId = (list: readonly EnemyDef[], id: string): EnemyDef => {
  const found = list.find((e) => e.id === id);
  if (!found) throw new Error(`missing enemy ${id}`);
  return found;
};

/** Intent cycle in the GDD shape: [id, windupMs, ...verbs]. */
const cycle = (intents: readonly Intent[]) => intents.map((i) => [i.id, i.windupMs, ...i.verbs]);

// docs/game/content/phase-1-implement.md "Enemies", row by row.
const PHASE_1 = [
  ['typo', 'Bugs', 30, [], [['nitpick', 3000, { verb: 'hit', n: 2 }]]],
  [
    'context_drift',
    'Context',
    140,
    [],
    [
      ['drift', 3500, { verb: 'noise', n: 6 }],
      ['nudge', 3500, { verb: 'hit', n: 4 }],
    ],
  ],
  [
    'rate_limit',
    'Infra',
    120,
    [],
    [
      ['throttle', 6000, { verb: 'throttle', sel: 'fastest', ms: 3000 }],
      ['retry_after', 3000, { verb: 'hit', n: 5 }],
    ],
  ],
  [
    'dependency_hell',
    'Process',
    120,
    [{ trait: 'split', n: 2, pct: 50, child: 'transitive_dep' }],
    [['version_conflict', 4000, { verb: 'hit', n: 3 }]],
  ],
  ['transitive_dep', 'Process', 60, [], [['peer_conflict', 3500, { verb: 'hit', n: 2 }]]],
  [
    'scope_creep',
    'Process',
    100,
    [{ trait: 'grow', ms: 4000, sev: 6, dmg: 1 }],
    [['feature_request', 3000, { verb: 'hit', n: 2 }]],
  ],
  [
    'unreachable_service',
    'Infra',
    120,
    [{ trait: 'outage', tag: 'Web' }],
    [['timeout', 4000, { verb: 'hit', n: 4 }]],
  ],
] as const;

describe('phase-1 enemies match the GDD', () => {
  it('defines exactly the seven phase-1 enemies', () => {
    expect(phase1Enemies.map((e) => e.id)).toEqual(PHASE_1.map((row) => row[0]));
  });

  it.each(PHASE_1)('%s: family, Severity, traits and intent cycle', (...row) => {
    const [id, fam, sev, traits, cyc] = row;
    const e = byId(phase1Enemies, id);
    expect({ family: e.family, sev: e.sev, homePhase: e.homePhase }).toEqual({
      family: fam,
      sev,
      homePhase: 1,
    });
    expect(e.traits).toEqual(traits);
    expect(cycle(e.cycle)).toEqual(cyc);
    expect(e.opening).toBeUndefined();
  });
});

describe('Yak Shave elite matches the GDD', () => {
  it('Yak Shave is Blocked and spawns Side Quest at the front, capped', () => {
    const yak = byId(yakShaveEnemies, 'yak_shave');
    expect([yak.family, yak.sev, yak.traits]).toEqual(['Process', 220, [{ trait: 'blocked' }]]);
    expect(cycle(yak.cycle)).toEqual([
      ['shave', 4500, { verb: 'hit', n: 9 }],
      [
        'another_thing_first',
        9000,
        { verb: 'spawn', enemy: 'side_quest', max: 2, at: 'front', perFight: 2, maxOthers: 3 },
      ],
    ]);
  });

  it('its three tasks and Side Quest have the GDD stat blocks', () => {
    const rows = ['install_dependency', 'update_toolchain', 'fix_unrelated_bug', 'side_quest'];
    const got = rows.map((id) => {
      const e = byId(yakShaveEnemies, id);
      return [e.sev, e.traits.length, ...cycle(e.cycle).flat().slice(1)];
    });
    expect(got).toEqual([
      [40, 0, 2500, { verb: 'hit', n: 3 }],
      [40, 0, 5000, { verb: 'throttle', sel: 'leftmost', ms: 1500 }],
      [40, 0, 3000, { verb: 'noise', n: 5 }],
      [30, 0, 2500, { verb: 'hit', n: 3 }],
    ]);
  });
});

describe('Legacy Monolith matches the GDD', () => {
  const boss = byId(monolithEnemies, 'legacy_monolith');
  const legacyCode = ['legacy_code', 4000, { verb: 'hit', n: 8 }];
  const spawnAdd = [
    'undocumented_behavior',
    7000,
    { verb: 'spawn', enemy: 'undocumented_behavior', max: 2, at: 'front' },
  ];

  it('is a Process boss with 360 Severity, 3 armor layers of 50 and a stage handler', () => {
    expect([boss.family, boss.sev, boss.handler]).toEqual(['Process', 360, 'monolith_stage']);
    expect(boss.traits).toEqual([{ trait: 'armor', layers: 3, hp: 50 }]);
  });

  it('has stages A, B and C with their layer ranges and cycles', () => {
    const stages = (boss.stages ?? []).map((s) => [s.id, s.layers, cycle(s.cycle)]);
    expect(stages).toEqual([
      ['a', [3, 3], [legacyCode, spawnAdd]],
      [
        'b',
        [1, 2],
        [
          legacyCode,
          ['big_ball_of_mud', 4000, { verb: 'hit', n: 5 }, { verb: 'noise', n: 8 }],
          spawnAdd,
        ],
      ],
      ['c', [0, 0], [['spaghetti', 2000, { verb: 'hit', n: 5 }]]],
    ]);
    expect(boss.cycle).toEqual(boss.stages?.[0]?.cycle);
  });

  it('spawns Undocumented Behavior (Process, 30, Side Effect: hit 3 + noise 3, 3000)', () => {
    const add = byId(monolithEnemies, 'undocumented_behavior');
    expect([add.family, add.sev, cycle(add.cycle)]).toEqual([
      'Process',
      30,
      [['side_effect', 3000, { verb: 'hit', n: 3 }, { verb: 'noise', n: 3 }]],
    ]);
  });
});

describe('enemy registry and strings', () => {
  const strings: Readonly<Record<string, string>> = en;

  it('has unique ids and no Copy-Paste Clone', () => {
    const ids = enemies.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(14);
    expect(ids).not.toContain('copy_paste_clone');
  });

  it('every enemy, intent, stage and handler has an en string', () => {
    for (const e of enemies as readonly EnemyDef[]) {
      const stages = e.stages ?? [];
      const intents = [...e.cycle, ...stages.flatMap((s) => s.cycle)];
      const keys = [
        `enemy.${e.id}.name`,
        ...intents.map((i) => `enemy.${e.id}.intent.${i.id}`),
        ...stages.map((s) => `enemy.${e.id}.stage.${s.id}`),
        ...(e.handler ? [`handler.${e.handler}`] : []),
      ];
      for (const key of keys) expect(strings[key], key).toBeTypeOf('string');
    }
  });

  it('every enemy renders trait and intent lines', () => {
    const lines = enemies.flatMap((e) => {
      const text = describeEnemy(e);
      return [...text.traits, ...text.intents];
    });
    expect(lines).toContain('When resolved, splits into 2 Transitive Dep at 50% Severity.');
    expect(lines).toContain('Summon Side Quest (at most 2).');
    for (const line of lines) expect(line).not.toMatch(/[{}]/);
  });
});
