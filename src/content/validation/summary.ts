// Rule 6: a content summary (counts per kind, per rarity and per encounter pool). The test
// snapshots it, so an accidental deletion shows up as a diff with a readable message.
import { CONTENT_KINDS, type Content } from '../index.ts';
import type { Rarity } from '../types/basics.ts';

export type Summary = Readonly<Record<string, number>>;

const RARITIES: readonly Rarity[] = ['common', 'uncommon', 'rare'];
const RARITY_KINDS = ['tools', 'skills', 'memories'] as const;

export function summarize(c: Content): Summary {
  const out: Record<string, number> = {};
  for (const kind of CONTENT_KINDS) out[kind] = c[kind].length;
  for (const kind of RARITY_KINDS) {
    for (const r of RARITIES) out[`${kind}.${r}`] = c[kind].filter((x) => x.rarity === r).length;
  }
  for (const e of c.encounters) {
    const key = `encounters.p${e.phase}.${e.pool}`;
    out[key] = (out[key] ?? 0) + 1;
  }
  return out;
}

/** One message per count that differs from `expected`, e.g. "tools.common: 9 -> 8". */
export function compareSummary(expected: Summary, actual: Summary): string[] {
  const keys = [...new Set([...Object.keys(expected), ...Object.keys(actual)])].sort();
  return keys.flatMap((k) =>
    expected[k] === actual[k] ? [] : [`[rule 6] ${k}: ${expected[k] ?? 0} -> ${actual[k] ?? 0}`],
  );
}
