import fc from 'fast-check';
import { afterEach, describe, expect, it } from 'vitest';
import { ceilDiv, clamp, mulDiv, pct, setDevAsserts } from './int.ts';

afterEach(() => setDevAsserts(true));

describe('int', () => {
  it('pct rounds half up', () => {
    const ref = (x: number, p: number) => Math.floor((x * (100 + p) + 50) / 100);
    for (const p of [-50, -1, 0, 1, 25, 50, 100]) {
      for (const x of [0, 1, 3, 5, 7, 10, 99, 1000]) expect(pct(x, p)).toBe(ref(x, p));
    }
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100000 }),
        fc.integer({ min: -100, max: 500 }),
        (x, p) => {
          expect(pct(x, p)).toBe(ref(x, p));
        },
      ),
    );
    expect(pct(5, 10)).toBe(6);
    expect(pct(10, 0)).toBe(10);
    expect(pct(10, -100)).toBe(0);
  });

  it('mulDiv floors', () => {
    expect(mulDiv(10, 3, 4)).toBe(7);
    expect(mulDiv(8, 3, 4)).toBe(6);
    expect(mulDiv(0, 5, 3)).toBe(0);
  });

  it('mulDiv asserts safe integers', () => {
    expect(() => mulDiv(2 ** 40, 2 ** 40, 3)).toThrow(RangeError);
    expect(() => mulDiv(1, 1, 0)).toThrow(RangeError);
    expect(() => mulDiv(1.5, 1, 1)).toThrow(RangeError);
    expect(() => pct(2 ** 52, 100)).toThrow(RangeError);
  });

  it('assertions can be disabled', () => {
    setDevAsserts(false);
    expect(() => mulDiv(2 ** 40, 2 ** 40, 3)).not.toThrow();
  });

  it('clamp bounds', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });

  it('ceilDiv handles exact multiples and remainders', () => {
    expect(ceilDiv(10, 5)).toBe(2);
    expect(ceilDiv(11, 5)).toBe(3);
    expect(ceilDiv(1, 5)).toBe(1);
    expect(ceilDiv(0, 5)).toBe(0);
    expect(ceilDiv(5, 5)).toBe(1);
    expect(() => ceilDiv(1, 0)).toThrow(RangeError);
  });
});
