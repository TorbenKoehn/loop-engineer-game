import { readFileSync } from 'node:fs';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { Rng } from './rng.ts';
import {
  createRng,
  fork,
  forkSeed,
  int,
  nextInt,
  nextU32,
  pick,
  restore,
  serialize,
  shuffle,
  weighted,
} from './rng.ts';

const take = (r: Rng, n: number) => Array.from({ length: n }, () => nextU32(r));

// nextInt(100) from the reference uint32 stream with the same rejection rule.
const NEXT_INT_GOLDEN = [98, 48, 20, 91, 35, 10, 80, 39];

// Reference values: bryc's cyrb128 + sfc32 (12 warm-up draws), run independently in Node
// (see forge/reviews/R003-T003.md). They prove the algorithm, not just stability.
describe('rng golden (independent reference)', () => {
  it('sfc32 core matches the reference from state [1, 2, 3, 4]', () => {
    const r: Rng = [1, 2, 3, 4];
    const xs = take(r, 1000);
    expect(xs.slice(0, 3)).toEqual([7, 34, 56623200]);
    expect(xs[999]).toBe(1810128320);
  });
  it('seed K7Q2-M9XA yields the reference sequence', () => {
    expect(take(createRng('K7Q2-M9XA'), 5)).toEqual([
      1816276898, 3579975248, 3831263920, 2491312191, 3589079935,
    ]);
  });
  it('fork K7Q2-M9XA/combat/p1-r3-c2 yields the reference sequence', () => {
    expect(take(fork('K7Q2-M9XA', 'combat/p1-r3-c2'), 3)).toEqual([
      4244083357, 2713881700, 242476162,
    ]);
  });
  it('empty seed yields the reference sequence', () => {
    expect(take(createRng(''), 3)).toEqual([780688151, 1369530603, 4170761935]);
  });
  it('nextInt sequence is pinned', () => {
    const r = createRng('K7Q2-M9XA');
    expect(Array.from({ length: 8 }, () => nextInt(r, 100))).toEqual(NEXT_INT_GOLDEN);
  });
  it('different seeds differ', () => {
    expect(take(createRng('a'), 4)).not.toEqual(take(createRng('b'), 4));
  });
});

describe('rng state', () => {
  it('serializes to JSON [a, b, c, d] and continues the sequence', () => {
    const r = createRng('s');
    take(r, 7);
    const json = serialize(r);
    expect(JSON.parse(json)).toEqual([...r]);
    const copy = restore(json);
    expect(take(copy, 20)).toEqual(take(r, 20));
  });
  it('rejects invalid state', () => {
    expect(() => restore('[1,2,3]')).toThrow();
    expect(() => restore('[1,2,3,1.5]')).toThrow();
    expect(() => restore('[1,2,3,4294967296]')).toThrow();
    expect(() => restore('{"s":[1,2,3,4]}')).toThrow();
  });
});

describe('rng fork', () => {
  it('is deterministic and depends only on seed and path', () => {
    const parent = createRng('seed');
    take(parent, 50);
    expect(take(fork('seed', 'shop'), 10)).toEqual(take(fork('seed', 'shop'), 10));
    expect(take(fork('seed', 'shop'), 10)).toEqual(take(createRng('seed/shop'), 10));
  });
  it('forkSeed composes paths', () => {
    expect(forkSeed(forkSeed('run', 'combat'), 'p1-r3-c2')).toBe('run/combat/p1-r3-c2');
  });
  it('paths give different streams', () => {
    expect(take(fork('seed', 'shop'), 4)).not.toEqual(take(fork('seed', 'combat'), 4));
  });
  it('drawing from one fork does not alter another (property)', () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), fc.string(), fc.nat(100), (seed, l1, l2, k) => {
        fc.pre(l1 !== l2);
        const fresh = take(fork(seed, l2), 8);
        const f1 = fork(seed, l1);
        const f2 = fork(seed, l2);
        take(f1, k);
        expect(take(f2, 8)).toEqual(fresh);
      }),
    );
  });
});

describe('rng integer helpers', () => {
  it('nextInt stays in [0, n) and is an integer (property)', () => {
    fc.assert(
      fc.property(fc.string(), fc.integer({ min: 1, max: 4294967296 }), (seed, n) => {
        const r = createRng(seed);
        for (let i = 0; i < 20; i++) {
          const x = nextInt(r, n);
          expect(Number.isInteger(x)).toBe(true);
          expect(x).toBeGreaterThanOrEqual(0);
          expect(x).toBeLessThan(n);
        }
      }),
    );
  });
  it('int is inclusive and pick returns members (property)', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.integer({ min: -1000, max: 1000 }),
        fc.nat(500),
        (seed, lo, w) => {
          const r = createRng(seed);
          for (let i = 0; i < 20; i++) {
            const x = int(r, lo, lo + w);
            expect(Number.isInteger(x) && x >= lo && x <= lo + w).toBe(true);
          }
          const arr = ['a', 'b', 'c'];
          expect(arr).toContain(pick(r, arr));
        },
      ),
    );
  });
  it('covers every value of a small range', () => {
    const r = createRng('cover');
    const seen = new Set(Array.from({ length: 200 }, () => int(r, 0, 3)));
    expect([...seen].sort()).toEqual([0, 1, 2, 3]);
  });
  it('rejects bad arguments', () => {
    const r = createRng('x');
    expect(() => nextInt(r, 0)).toThrow();
    expect(() => nextInt(r, 1.5)).toThrow();
    expect(() => int(r, 5, 4)).toThrow();
    expect(() => pick(r, [])).toThrow();
  });
});

const asc = (x: number, y: number): number => x - y;

function weightedNeverPicksZero(seed: string, ws: number[]): void {
  fc.pre(ws.some((w) => w > 0));
  const r = createRng(seed);
  const entries = ws.map((weight, value) => ({ value, weight }));
  for (let i = 0; i < 30; i++) expect(ws[weighted(r, entries)]).toBeGreaterThan(0);
}

describe('rng weighted and shuffle', () => {
  it('weighted never picks a zero weight and covers positive ones (property)', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.array(fc.nat(5), { minLength: 1, maxLength: 6 }),
        weightedNeverPicksZero,
      ),
    );
    const r = createRng('w');
    const entries = [
      { value: 'a', weight: 1 },
      { value: 'b', weight: 0 },
      { value: 'c', weight: 3 },
    ];
    const seen = new Set(Array.from({ length: 200 }, () => weighted(r, entries)));
    expect([...seen].sort()).toEqual(['a', 'c']);
  });
  it('weighted rejects bad weights', () => {
    const r = createRng('x');
    expect(() => weighted(r, [])).toThrow();
    expect(() => weighted(r, [{ value: 1, weight: 0 }])).toThrow();
    expect(() => weighted(r, [{ value: 1, weight: 1.5 }])).toThrow();
    expect(() =>
      weighted(r, [
        { value: 1, weight: -1 },
        { value: 2, weight: 3 },
      ]),
    ).toThrow();
  });
  it('shuffle is a deterministic permutation and leaves the input intact (property)', () => {
    fc.assert(
      fc.property(fc.string(), fc.array(fc.integer()), (seed, arr) => {
        const before = arr.slice();
        const out = shuffle(createRng(seed), arr);
        expect(arr).toEqual(before);
        expect(out.slice().sort(asc)).toEqual(arr.slice().sort(asc));
        expect(shuffle(createRng(seed), arr)).toEqual(out);
      }),
    );
  });
});

describe('rng purity', () => {
  it('rng.ts uses no Math.random, Date, performance, crypto, timers or DOM', () => {
    const src = readFileSync(new URL('./rng.ts', import.meta.url), 'utf8');
    expect(src).not.toMatch(
      /Math\.random|\bDate\b|performance|crypto|setTimeout|setInterval|\bwindow\b|\bdocument\b/,
    );
  });
});
