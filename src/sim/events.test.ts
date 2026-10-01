import { describe, expect, it } from 'vitest';
import { type CombatEvent, serializeEvent, serializeLog, stableStringify } from './events.ts';

const why = ['zone:focused', 'prime:read_file'];
const d = { why, zone: 1, sev: 4, pct: 20, guard: 0, flat: 2, armor: 1, base: 10 };
// Keys deliberately inserted in reverse order.
const damage: CombatEvent = { d, v: 14, dst: 'e3', src: 't0', kind: 'damage', t: 1250, seq: 7 };

describe('serializeEvent', () => {
  it('uses the fixed key order seq,t,kind,src,dst,v,d, sorted d keys and no whitespace', () => {
    expect(serializeEvent(damage)).toBe(
      '{"seq":7,"t":1250,"kind":"damage","src":"t0","dst":"e3","v":14,"d":{"armor":1,"base":10,' +
        '"flat":2,"guard":0,"pct":20,"sev":4,"why":["zone:focused","prime:read_file"],"zone":1}}',
    );
  });

  it('omits absent fields', () => {
    const e: CombatEvent = { seq: 0, t: 0, kind: 'deadline', src: 'sys', d: {} };
    expect(serializeEvent(e)).toBe('{"seq":0,"t":0,"kind":"deadline","src":"sys","d":{}}');
  });

  it('rejects non-integer numbers anywhere in the event', () => {
    const base = { seq: 0, kind: 'guard', src: 't1', dst: 'a' } as const;
    expect(() => serializeEvent({ ...base, t: 12.5, v: 3, d: { total: 3 } })).toThrow(RangeError);
    expect(() => serializeEvent({ ...base, t: 50, v: 3, d: { total: 0.1 } })).toThrow(RangeError);
    expect(() => serializeEvent({ ...base, t: 50, v: Number.NaN, d: { total: 1 } })).toThrow();
  });
});

describe('serializeLog', () => {
  it('writes JSONL: one event per line, each line terminated by a newline', () => {
    const start: CombatEvent = { seq: 0, t: 0, kind: 'deadline', src: 'sys', v: 0, d: {} };
    const lines = [serializeEvent(start), serializeEvent(damage), ''];
    expect(serializeLog([start, damage]).split('\n')).toEqual(lines);
    expect(serializeLog([])).toBe('');
  });
});

describe('stableStringify', () => {
  it('sorts object keys recursively and skips undefined values', () => {
    const value = { b: 1, a: { d: 'x', c: [2, 1] }, z: undefined };
    expect(stableStringify(value)).toBe('{"a":{"c":[2,1],"d":"x"},"b":1}');
  });

  it('rejects values that are not integers, strings, arrays or plain objects', () => {
    expect(() => stableStringify(true)).toThrow(TypeError);
    expect(() => stableStringify(null)).toThrow(TypeError);
    expect(() => stableStringify(Number.MAX_SAFE_INTEGER + 1)).toThrow(RangeError);
  });
});

it('CombatEvent narrows the payload by kind', () => {
  const e: CombatEvent = damage;
  expect(e.kind === 'damage' ? e.d.why : []).toEqual(why);
});
