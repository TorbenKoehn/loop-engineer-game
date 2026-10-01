// Seeded, forkable, integer-only RNG: sfc32 core, cyrb128 seed hashing (bryc reference).
// See docs/architecture/sim-core.md#rng. No floats, clocks or globals.

/** Seed string, e.g. `K7Q2-M9XA` or `daily-2026-10-01`. */
export type Seed = string;

/** sfc32 state `[a, b, c, d]` (4 x uint32). Plain data: JSON-serialisable as is. */
export type Rng = [number, number, number, number];

/** One `weighted` option; `weight` is a non-negative integer. */
export interface Weighted<T> {
  value: T;
  weight: number;
}

const TWO32 = 4294967296;

/** cyrb128: hash a string to 4 x uint32. */
function cyrb128(str: string): Rng {
  let h1 = 1779033703;
  let h2 = 3144134277;
  let h3 = 1013904242;
  let h4 = 2773480762;
  for (let i = 0; i < str.length; i++) {
    const k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  // Sequential: h2..h4 mix with the NEW h1, as in the reference.
  h1 ^= h2 ^ h3 ^ h4;
  h2 ^= h1;
  h3 ^= h1;
  h4 ^= h1;
  return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}

/** Create an RNG from a seed string. */
export function createRng(seed: Seed): Rng {
  const rng = cyrb128(seed);
  // Warm up as recommended for sfc32 seeding.
  for (let i = 0; i < 12; i++) nextU32(rng);
  return rng;
}

/** Child seed for `path`: `seed + '/' + path`. Composes: forkSeed(forkSeed(s, a), b). */
export function forkSeed(seed: Seed, path: string): Seed {
  return `${seed}/${path}`;
}

/** Fork by path, not by state: the stream depends only on `seed` and `path`. */
export function fork(seed: Seed, path: string): Rng {
  return createRng(forkSeed(seed, path));
}

/** Next uint32 in [0, 2^32). Advances the state in place. */
export function nextU32(rng: Rng): number {
  const [a, b, c, d] = rng;
  const t = (((a + b) >>> 0) + d) >>> 0;
  const c2 = ((c << 21) | (c >>> 11)) >>> 0;
  rng[0] = (b ^ (b >>> 9)) >>> 0;
  rng[1] = (c + (c << 3)) >>> 0;
  rng[2] = (c2 + t) >>> 0;
  rng[3] = (d + 1) >>> 0;
  return t;
}

/** Unbiased integer in [0, n), 1 <= n <= 2^32. */
export function nextInt(rng: Rng, n: number): number {
  if (!Number.isSafeInteger(n) || n < 1 || n > TWO32) {
    throw new RangeError(`nextInt: n must be an integer in [1, 2^32], got ${n}`);
  }
  if (n === TWO32) return nextU32(rng);
  const limit = TWO32 - (TWO32 % n); // reject the biased tail
  let x = nextU32(rng);
  while (x >= limit) x = nextU32(rng);
  return x % n;
}

/** Inclusive integer in [lo, hi]. */
export function int(rng: Rng, lo: number, hi: number): number {
  if (!Number.isSafeInteger(lo) || !Number.isSafeInteger(hi) || hi < lo) {
    throw new RangeError(`int: need integers lo <= hi, got ${lo}, ${hi}`);
  }
  return lo + nextInt(rng, hi - lo + 1);
}

/** Uniform element of a non-empty array. */
export function pick<T>(rng: Rng, arr: readonly T[]): T {
  if (arr.length === 0) throw new RangeError('pick: empty array');
  return arr[nextInt(rng, arr.length)] as T;
}

/** Sum of weights; throws unless all are non-negative integers with total in [1, 2^32]. */
function totalWeight<T>(entries: readonly Weighted<T>[]): number {
  let total = 0;
  for (const e of entries) {
    if (!Number.isSafeInteger(e.weight) || e.weight < 0) {
      throw new RangeError(`weighted: weight must be a non-negative integer, got ${e.weight}`);
    }
    total += e.weight;
  }
  if (total < 1 || total > TWO32)
    throw new RangeError(`weighted: total must be in [1, 2^32], got ${total}`);
  return total;
}

/** Element chosen with probability weight / total. One draw, entries in array order. */
export function weighted<T>(rng: Rng, entries: readonly Weighted<T>[]): T {
  let x = nextInt(rng, totalWeight(entries));
  for (const e of entries) {
    if (x < e.weight) return e.value;
    x -= e.weight;
  }
  throw new Error('weighted: unreachable');
}

/** Fisher-Yates shuffle. Returns a new array; the input is not mutated. */
export function shuffle<T>(rng: Rng, arr: readonly T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = nextInt(rng, i + 1);
    const tmp = out[i] as T;
    out[i] = out[j] as T;
    out[j] = tmp;
  }
  return out;
}

/** JSON snapshot of the state: `[a, b, c, d]`. */
export function serialize(rng: Rng): string {
  return JSON.stringify(rng);
}

/** Restore from `serialize` output; continues the same sequence. */
export function restore(json: string): Rng {
  const o: unknown = JSON.parse(json);
  const ok =
    Array.isArray(o) &&
    o.length === 4 &&
    o.every((v) => Number.isInteger(v) && v >= 0 && v < TWO32);
  if (!ok) throw new TypeError('restore: invalid RNG state, expected [a, b, c, d] uint32');
  return [o[0], o[1], o[2], o[3]];
}
