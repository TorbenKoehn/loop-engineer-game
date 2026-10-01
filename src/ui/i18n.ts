// t() and number/clock formatting (localisation.md "Rules"). Only `en` exists so far.
import { en, type StringKey } from '../content/strings/en.ts';

export type Params = Readonly<Record<string, string | number>>;

const table: Readonly<Record<string, string | undefined>> = en;
const PLACEHOLDER = /\{([a-zA-Z]+)\}/g;
const numbers = new Intl.NumberFormat('en');

/** Dev-only assertion: logs an error (fails e2e console checks), never throws. */
function devAssert(ok: boolean, message: string): void {
  if (!ok && import.meta.env.DEV) console.error(`[i18n] ${message}`);
}

/** The string for `key` with named `{placeholders}` filled; a missing key renders the key. */
export function t(key: StringKey, params: Params = {}): string {
  const template = table[key];
  devAssert(template !== undefined, `missing string key "${key}"`);
  return (template ?? key).replace(PLACEHOLDER, (raw, name: string) => {
    const value = params[name];
    devAssert(value !== undefined, `missing param {${name}} for "${key}"`);
    return value === undefined ? raw : typeof value === 'number' ? fmtNumber(value) : value;
  });
}

export const fmtNumber = (n: number): string => numbers.format(n);

const plurals = new Intl.PluralRules('en');

/** The `<base>.one` or `<base>.other` string for count `n` (localisation.md rule 4). */
export function tPlural(base: string, n: number, params: Params = {}): string {
  const form = plurals.select(n) === 'one' ? 'one' : 'other';
  return t(`${base}.${form}` as StringKey, { ...params, n });
}

const tenths = new Intl.NumberFormat('en', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Integer sim ms as seconds with one decimal, e.g. 27400 -> `27.4 s`. */
export const fmtSeconds = (ms: number): string =>
  t('ui.unit.seconds', { n: tenths.format(Math.max(0, ms) / 1000) });

const pad = (n: number, width = 2): string => String(n).padStart(width, '0');

/** Integer sim ms as `mm:ss.mmm`, e.g. 12350 -> `00:12.350`. */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.trunc(ms));
  const sec = Math.floor(total / 1000);
  return `${pad(Math.floor(sec / 60))}:${pad(sec % 60)}.${pad(total % 1000, 3)}`;
}
