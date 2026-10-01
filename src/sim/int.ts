// Integer math helpers: the only arithmetic helpers the sim uses (docs/architecture/sim-core.md).
let devAsserts = true;

export function setDevAsserts(enabled: boolean): void {
  devAsserts = enabled;
}

function safe(n: number, what: string): number {
  if (devAsserts && !Number.isSafeInteger(n)) {
    throw new RangeError(`int: ${what} is not a safe integer: ${n}`);
  }
  return n;
}

/** x scaled by (100 + p) percent, rounded half up. p may be negative. */
export function pct(x: number, p: number): number {
  return safe(Math.floor((safe(x * (100 + p), 'pct product') + 50) / 100), 'pct result');
}

/** Math.floor(x * a / b), asserting the product and result are safe integers. */
export function mulDiv(x: number, a: number, b: number): number {
  return safe(Math.floor(safe(x * a, 'mulDiv product') / b), 'mulDiv result');
}

export function clamp(x: number, lo: number, hi: number): number {
  return safe(Math.min(Math.max(x, lo), hi), 'clamp result');
}

export function ceilDiv(a: number, b: number): number {
  return safe(Math.floor((a + b - 1) / b), 'ceilDiv result');
}
