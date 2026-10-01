// Property tests for resolveCombat: determinism and the sim invariants 2, 4, 5 and 8 of
// docs/architecture/testing.md "Property tests (fast-check)". Arbitraries build random
// loadouts, item rules and encounters with the sim builders: src/sim (tests included) may not
// import content data (tests/arch.test.ts), so real content is pinned by the reference
// goldens in tools/golden instead.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type {
  Cond,
  Effect,
  EnemyDef,
  Intent,
  ModStat,
  Rule,
  Selector,
  SkillDef,
  Status,
  Tag,
  TargetSel,
  ToolDef,
  Trigger,
  V3,
  Value,
  Verb,
  VerbSel,
} from '../content/types/index.ts';
import { type CombatEvent, type Ref, serializeLog } from './events.ts';
import { type CombatInput, type CombatResult, resolveCombat } from './index.ts';
import { fight, intent, makeEnemy, makeRule, makeSkill, makeTool } from './testing/builders.ts';

const RUNS = 200;
/** 200 fights per property; generous for coverage runs on loaded CI workers. */
const TIMEOUT_MS = 60_000;
const OVERTIME_CAP_MS = 30_000;
const MINION = 'minion';

// ---- Arbitraries: values, selectors, effects -------------------------------------------

const int = (min: number, max: number) => fc.integer({ min, max });
/** A multiple of 50 ms in [lo, hi] ticks. */
const ms = (lo: number, hi: number) => int(lo, hi).map((n) => n * 50);
const v3 = (lo: number, hi: number): fc.Arbitrary<V3> =>
  fc.tuple(int(lo, hi), int(lo, hi), int(lo, hi));
const value = (lo: number, hi: number): fc.Arbitrary<Value> => fc.oneof(int(lo, hi), v3(lo, hi));
/** Trust or Severity: mostly [lo, hi], sometimes enough to outlast Deadline damage (timeouts). */
const pool = (lo: number, hi: number) =>
  fc.oneof({ arbitrary: int(lo, hi), weight: 4 }, { arbitrary: int(500, 800), weight: 1 });

const tag = fc.constantFrom<Tag>('Search', 'Edit', 'Test', 'Shell', 'Web', 'Agent');
const status = fc.constantFrom<Status>('haste', 'slow', 'throttle', 'stun');
const combatTarget = fc.constantFrom<TargetSel>('front', 'back', 'lowest', 'all');
const selector: fc.Arbitrary<Selector> = fc.oneof(
  fc.constantFrom<Selector>(
    'front',
    'back',
    'lowest',
    'all',
    'self',
    'tool',
    'rightTool',
    'tools',
    'fastest',
    'leftmost',
    'rightmost',
    'longestCharge',
  ),
  tag.map((t) => ({ tag: t })),
);

const effect: fc.Arbitrary<Effect> = fc.oneof(
  fc.record({ v: value(1, 20), target: combatTarget }).map((r): Effect => ({ do: 'dmg', ...r })),
  value(1, 12).map((v): Effect => ({ do: 'guard', v })),
  value(1, 8).map((v): Effect => ({ do: 'heal', v })),
  fc
    .record({ status, ms: value(1, 80), sel: selector })
    .map((r): Effect => ({ do: 'status', ...r, ms: scaleMs(r.ms) })),
  fc.record({ status, sel: selector }).map((r): Effect => ({ do: 'clearStatus', ...r })),
  fc
    .record({ ms: value(1, 60), sel: selector })
    .map((r): Effect => ({ do: 'charge', ...r, ms: scaleMs(r.ms) })),
  value(1, 20).map((v): Effect => ({ do: 'removeCtx', v })),
  fc.constant<Effect>({ do: 'compact' }),
  fc
    .record({ t: tag, pct: value(5, 100), count: int(1, 3) })
    .map(({ t, ...r }): Effect => ({ do: 'prime', filter: { tag: t }, ...r })),
);

/** Ticks -> ms for a fixed or per-version duration. */
function scaleMs(v: Value): Value {
  return typeof v === 'number' ? v * 50 : [v[0] * 50, v[1] * 50, v[2] * 50];
}

// ---- Arbitraries: loadout and item rules -----------------------------------------------

const toolDef = fc.record(
  {
    tags: fc.oneof(
      tag.map((t): ToolDef['tags'] => [t]),
      fc.tuple(tag, tag).map((t): ToolDef['tags'] => t),
    ),
    weight: int(0, 6),
    cooldownMs: ms(10, 120),
    output: int(0, 5),
    pipeMs: ms(0, 30),
    target: combatTarget,
    effects: fc.array(effect, { minLength: 1, maxLength: 3 }),
  },
  { requiredKeys: ['tags', 'weight', 'cooldownMs', 'output', 'target', 'effects'] },
);

const trigger: fc.Arbitrary<Trigger> = fc.oneof(
  fc.constantFrom<Trigger>(
    { on: 'fightStart' },
    { on: 'fightWon' },
    { on: 'compaction' },
    { on: 'guardGained' },
    { on: 'guardGained', fromTool: true },
  ),
  ms(10, 100).map((n): Trigger => ({ on: 'every', ms: n })),
  tag.map((t): Trigger => ({ on: 'toolFired', tag: t })),
  int(0, 6).map((n): Trigger => ({ on: 'damaged', min: n })),
  int(10, 90).map((n): Trigger => ({ on: 'trustBelow', pct: n })),
);

const cond: fc.Arbitrary<Cond> = fc.oneof(
  fc.constantFrom<Cond>(
    { if: 'zone', is: 'focused' },
    { if: 'zone', is: 'rot' },
    { if: 'piped' },
    { if: 'adjacentSharesTag' },
    { if: 'oncePerFight' },
    { if: 'oncePerRun' },
  ),
  int(1, 4).map((n): Cond => ({ if: 'nth', n })),
  ms(10, 80).map((n): Cond => ({ if: 'cooldown', ms: n })),
  ms(10, 80).map((n): Cond => ({ if: 'cooldownAtMost', ms: n })),
);

const STATS: readonly ModStat[] = [
  'rate',
  'dmgPct',
  'dmgFlat',
  'output',
  'window',
  'pipeMs',
  'focusPct',
  'noiseBlock',
  'throttleDurPct',
  'stunDurPct',
  'dmgTakenPct',
  'healPct',
];
const passive = fc
  .record({ stat: fc.constantFrom(...STATS), v: int(-30, 60) })
  .map(({ stat, v }): Rule => makeRule({ on: 'passive' }, [{ do: 'mod', stat, v }]));

const rule: fc.Arbitrary<Rule> = fc.oneof(
  passive,
  fc
    .record({
      when: trigger,
      conds: fc.array(cond, { maxLength: 1 }),
      effects: fc.array(effect, { minLength: 1, maxLength: 2 }),
    })
    .map(({ when, conds, effects }) => makeRule(when, effects, conds.length ? conds : undefined)),
);

const skills = fc
  .array(fc.array(rule, { minLength: 1, maxLength: 2 }), { maxLength: 2 })
  .map((sets): SkillDef[] => sets.map((rules, i) => makeSkill(`skill_${i}`, ...rules)));

// ---- Arbitraries: encounter ------------------------------------------------------------

const verbSel: fc.Arbitrary<VerbSel> = fc.oneof(
  fc.constantFrom<VerbSel>('fastest', 'leftmost', 'rightmost', 'all'),
  tag.map((t) => ({ tag: t })),
);

const spawn = fc
  .record(
    {
      max: int(1, 3),
      at: fc.constantFrom<'front' | 'back'>('front', 'back'),
      perFight: int(1, 3),
      maxOthers: int(1, 4),
    },
    { requiredKeys: ['max'] },
  )
  .map((r): Verb => ({ verb: 'spawn', enemy: MINION, ...r }));

const verb: fc.Arbitrary<Verb> = fc.oneof(
  int(1, 8).map((n): Verb => ({ verb: 'hit', n })),
  fc.record({ n: int(1, 4), times: int(2, 3) }).map((r): Verb => ({ verb: 'multiHit', ...r })),
  int(1, 15).map((n): Verb => ({ verb: 'noise', n })),
  fc.record({ sel: verbSel, ms: ms(4, 60) }).map((r): Verb => ({ verb: 'throttle', ...r })),
  fc.record({ sel: verbSel, ms: ms(4, 60) }).map((r): Verb => ({ verb: 'slow', ...r })),
  ms(4, 40).map((n): Verb => ({ verb: 'stun', ms: n })),
  int(1, 10).map((n): Verb => ({ verb: 'guard', n })),
  int(1, 10).map((n): Verb => ({ verb: 'heal', n })),
  spawn,
);

const intents = (maxLength: number) =>
  fc
    .array(
      fc.record({ windupMs: ms(10, 100), verbs: fc.array(verb, { minLength: 1, maxLength: 2 }) }),
      { maxLength },
    )
    .map((list): Intent[] =>
      list.map(({ windupMs, verbs }, i) =>
        intent(`i${i}`, windupMs, ...(verbs as [Verb] | [Verb, Verb])),
      ),
    );

const enemyOf = (id: string) =>
  fc
    .record({
      family: fc.constantFrom<EnemyDef['family']>('Bugs', 'Context', 'Infra', 'Process'),
      homePhase: fc.constantFrom<1 | 2 | 3>(1, 2, 3),
      sev: pool(5, 150),
      opening: intents(1),
      cycle: intents(3),
    })
    .map((r): EnemyDef => makeEnemy({ id, ...r }));

// ---- Arbitrary: a whole fight ----------------------------------------------------------

const combatInput: fc.Arbitrary<CombatInput> = fc
  .record({
    seed: fc.string({ maxLength: 12 }),
    tools: fc.array(toolDef, { maxLength: 5 }),
    version: fc.constantFrom<1 | 2 | 3>(1, 2, 3),
    enemies: fc.array(enemyOf('enemy'), { minLength: 1, maxLength: 4 }),
    minion: enemyOf(MINION),
    skills,
    phase: fc.constantFrom<1 | 2 | 3>(1, 2, 3),
    trust: pool(1, 80),
    speed: int(50, 200),
    window: int(40, 200),
    accuracy: fc.constantFrom('high', 'normal', 'low'),
    deadlineMs: int(1, 40).map((s) => s * 1000),
    policy: fc.constantFrom<CombatInput['policy']>(0, 70, 80, 90),
    noise: int(0, 30),
  })
  .map(({ tools, minion, skills: sk, policy, noise, ...spec }): CombatInput => {
    const defs = tools.map((t, i) => makeTool({ id: `tool_${i}`, ...t }));
    const base = fight({ ...spec, tools: defs, spawnDefs: [minion] });
    const modifiers = noise ? [{ mod: 'startNoise', tokens: noise } as const] : [];
    return { ...base, skills: sk, policy, modifiers };
  });

// ---- Invariant checks ------------------------------------------------------------------

/** Paths of numbers in `value` that are not safe integers (invariant 8). */
function unsafeNumbers(value: unknown, path = '$'): string[] {
  if (typeof value === 'number') return Number.isSafeInteger(value) ? [] : [`${path}=${value}`];
  if (Array.isArray(value)) return value.flatMap((v, i) => unsafeNumbers(v, `${path}[${i}]`));
  if (typeof value === 'object' && value !== null)
    return Object.entries(value).flatMap(([k, v]) => unsafeNumbers(v, `${path}.${k}`));
  return [];
}

/** Trust (`a`) and Severity (`e<uid>`) as replayed from the log. */
type Pools = Map<Ref, number>;

/** A `damage` (sign -1) or `heal` (sign 1) must move its target's pool by exactly `v`. */
function landed(hp: Pools, e: CombatEvent, sign: 1 | -1, after: number): string | undefined {
  const before = e.dst === undefined ? undefined : hp.get(e.dst);
  const v = e.v ?? 0;
  if (e.dst === undefined || before === undefined || v < 0 || after !== before + sign * v)
    return `seq ${e.seq}: ${e.kind} ${e.dst} ${before} -> ${after} (v ${v})`;
  hp.set(e.dst, after);
  return undefined;
}

/** Resolved enemies sit at 0; fightEnd reports the replayed Trust. */
function endViolation(hp: Pools, e: CombatEvent): string | undefined {
  if (e.kind === 'resolved' && hp.get(e.src ?? 'sys') !== 0)
    return `seq ${e.seq}: ${e.src} resolved at ${hp.get(e.src ?? 'sys')}`;
  if (e.kind === 'fightEnd' && e.d.trust !== hp.get('a'))
    return `seq ${e.seq}: fightEnd trust ${e.d.trust}, log says ${hp.get('a')}`;
  return undefined;
}

function poolStep(hp: Pools, e: CombatEvent): string | undefined {
  if (e.kind === 'damage') return landed(hp, e, -1, e.d.sev);
  if (e.kind === 'heal') return landed(hp, e, 1, e.d.total);
  if (e.kind === 'fightStart') hp.set('a', e.d.trust);
  if (e.kind === 'spawn' && e.dst) hp.set(e.dst, e.v ?? 0);
  return endViolation(hp, e);
}

/**
 * Replays Trust and Severity from the log (invariant 4): they change only through `damage`
 * (down by exactly `v`), `heal` (up by exactly `v`) and `spawn` (a new enemy), so no hidden
 * change survives to the next event of that unit. Returns the first violation.
 */
function hpViolation(events: readonly CombatEvent[]): string | undefined {
  const hp: Pools = new Map();
  for (const e of events) {
    const violation = poolStep(hp, e);
    if (violation) return violation;
  }
  return undefined;
}

/** Invariant 5: seq 0, 1, 2, ...; t never decreases and sits on the 50 ms grid. */
function orderViolation(events: readonly CombatEvent[]): string | undefined {
  for (const [i, e] of events.entries()) {
    const prevT = events[i - 1]?.t ?? 0;
    if (e.seq !== i || e.t < prevT || e.t % 50 !== 0) return `seq ${e.seq} at index ${i}, t ${e.t}`;
  }
  return undefined;
}

const check = (predicate: (input: CombatInput, result: CombatResult) => void) => {
  fc.assert(
    fc.property(combatInput, (input) => predicate(input, resolveCombat(input))),
    { numRuns: RUNS },
  );
};

describe('resolveCombat properties (random loadouts and encounters)', () => {
  it(
    'same input twice gives identical logs',
    () => {
      check((input, first) => {
        const second = resolveCombat(input);
        expect(serializeLog(second.events)).toBe(serializeLog(first.events));
        expect({ ...second, events: [] }).toEqual({ ...first, events: [] });
      });
    },
    TIMEOUT_MS,
  );

  it(
    'invariant 2: every fight ends by deadlineMs + 30 000',
    () => {
      check((input, { endT, events }) => {
        const cap = input.encounter.deadlineMs + OVERTIME_CAP_MS;
        expect(endT).toBeLessThanOrEqual(cap);
        expect(events.at(-1)).toMatchObject({ kind: 'fightEnd', t: endT, v: endT });
      });
    },
    TIMEOUT_MS,
  );

  it(
    'invariant 4: Trust and Severity change only via damage, heal and spawn events',
    () => {
      check((_, { events, agentAfter }) => {
        expect(hpViolation(events)).toBeUndefined();
        const end = events.at(-1);
        expect(end?.kind === 'fightEnd' && end.d.trust).toBe(agentAfter.trust);
      });
    },
    TIMEOUT_MS,
  );

  it(
    'invariant 5: seq strictly increases, t never decreases and is a multiple of 50',
    () => {
      check((_, { events }) => {
        expect(events[0]?.kind).toBe('fightStart');
        expect(orderViolation(events)).toBeUndefined();
      });
    },
    TIMEOUT_MS,
  );

  it(
    'invariant 8: all stored numbers are safe integers',
    () => {
      check((_, result) => {
        expect(unsafeNumbers(result)).toEqual([]);
        expect(serializeLog(result.events)).toMatch(/"kind":"fightEnd"/); // throws on unsafe numbers
      });
    },
    TIMEOUT_MS,
  );
});

describe('invariant checkers', () => {
  const log = resolveCombat(fight()).events;
  const at = (seq: number, patch: object): CombatEvent[] =>
    log.map((e) => (e.seq === seq ? ({ ...e, ...patch } as CombatEvent) : e));

  it('hpViolation accepts a real log and flags a hidden Severity change', () => {
    expect(hpViolation(log)).toBeUndefined();
    const hit = log.find((e) => e.kind === 'damage' && e.dst === 'e1');
    if (hit?.kind !== 'damage') throw new Error('no hit on e1');
    expect(hpViolation(at(hit.seq, { d: { ...hit.d, sev: hit.d.sev + 1 } }))).toMatch(/damage e1/);
  });

  it('orderViolation and unsafeNumbers flag broken seq, off-grid t and fractions', () => {
    expect(orderViolation(log)).toBeUndefined();
    expect(orderViolation(at(3, { t: 3025 }))).toMatch(/t 3025/);
    expect(orderViolation(at(3, { seq: 2 }))).toMatch(/seq 2/);
    expect(unsafeNumbers({ a: [1, 2.5], b: { c: 2 ** 53 } })).toEqual([
      '$.a[1]=2.5',
      `$.b.c=${2 ** 53}`,
    ]);
  });
});
