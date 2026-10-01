// Template filling and sentence composition. Locale number formatting is the UI's (E006).
import type { Strings } from '../strings/en.ts';

export type Params = Readonly<Record<string, string | number>>;

const PLACEHOLDER = /\{([a-zA-Z]+)\}/g;

/** Template key of a DSL kind: kindKey('effect', 'removeCtx') -> 'effect.remove_ctx'. */
export const kindKey = (group: string, kind: string): string =>
  `${group}.${kind.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)}`;

const lookup = (strings: Strings, key: string): string | undefined =>
  (strings as Readonly<Record<string, string | undefined>>)[key];

/** Looks up `key` and fills its named placeholders; throws on a missing key or param. */
export function render(strings: Strings, key: string, params: Params = {}): string {
  const template = lookup(strings, key);
  if (template === undefined) throw new Error(`Missing string key: ${key}`);
  return template.replace(PLACEHOLDER, (_, name: string) => {
    const value = params[name];
    if (value === undefined) throw new Error(`Missing param {${name}} for ${key}`);
    return String(value);
  });
}

/** A content name by key, falling back to the raw id until the data task adds the key. */
export const nameOf = (strings: Strings, key: string, id: string): string =>
  lookup(strings, key) ?? id;

/** Joins clauses as "a, b and c" through the `text.list` and `text.and` templates. */
export function joinAnd(strings: Strings, clauses: readonly string[]): string {
  const last = clauses.at(-1) ?? '';
  if (clauses.length < 2) return last;
  const head = clauses.slice(0, -1).reduce((a, b) => render(strings, 'text.list', { a, b }));
  return render(strings, 'text.and', { a: head, b: last });
}

/** A clause as a sentence: `text.sentence`, first letter upper-cased. */
export function sentence(strings: Strings, clause: string): string {
  const text = render(strings, 'text.sentence', { clause });
  return text.charAt(0).toUpperCase() + text.slice(1);
}
