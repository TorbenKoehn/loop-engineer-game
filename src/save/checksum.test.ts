import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { canonicalJson, sha256Hex } from './checksum.ts';

const nodeSha = (s: string): string => createHash('sha256').update(s, 'utf8').digest('hex');

describe('canonicalJson', () => {
  it('sorts keys at every depth and drops whitespace', () => {
    const v = { b: 1, a: { d: [3, { z: 1, y: 'x' }], c: null }, ä: true };
    expect(canonicalJson(v)).toBe('{"a":{"c":null,"d":[3,{"y":"x","z":1}]},"b":1,"ä":true}');
  });

  it('is independent of insertion order and matches JSON.parse round trips', () => {
    const a = canonicalJson({ x: 1, y: [1, 2] });
    expect(canonicalJson({ y: [1, 2], x: 1 })).toBe(a);
    expect(JSON.parse(a)).toEqual({ x: 1, y: [1, 2] });
  });

  it('drops undefined fields and writes undefined array items as null, like JSON', () => {
    expect(canonicalJson({ a: undefined, b: [undefined, 'q"'] })).toBe('{"b":[null,"q\\""]}');
    expect(canonicalJson(undefined)).toBe('null');
  });
});

describe('sha256Hex', () => {
  it('matches the FIPS 180-4 test vectors', () => {
    expect(sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    expect(sha256Hex('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('matches node:crypto across padding boundaries and non-ASCII text', () => {
    for (let n = 0; n < 200; n++) {
      const s = 'aé€😀'.repeat(n).slice(0, n * 2);
      expect(sha256Hex(s)).toBe(nodeSha(s));
    }
    const big = canonicalJson({ log: Array.from({ length: 5000 }, (_, i) => ({ t: 'go', i })) });
    expect(sha256Hex(big)).toBe(nodeSha(big));
  });
});
