// Rule 5: milestone flags match the slice id lists of the GDD (docs/game/vertical-slice.md
// "In scope"). Kinds with a `milestone` flag must be M1 exactly when listed; for the other
// kinds every listed id must exist. The test reads the lists from the doc.
import type { Content } from '../index.ts';
import type { Milestone } from '../types/items.ts';

/** The M1 id lists of the vertical slice. */
export interface SliceIds {
  readonly tools: readonly string[];
  readonly skills: readonly string[];
  readonly memories: readonly string[];
  readonly events: readonly string[];
  readonly encounters: readonly string[];
  readonly harnesses: readonly string[];
  readonly prompts: readonly string[];
}

const FLAGGED = ['tools', 'events', 'harnesses', 'prompts'] as const;
const UNFLAGGED = ['skills', 'memories', 'encounters'] as const;

const err = (msg: string) => `[rule 5] ${msg}`;

interface Flagged {
  readonly id: string;
  readonly milestone: Milestone;
}

function flags(kind: string, items: readonly Flagged[], listed: readonly string[]): string[] {
  return items.flatMap(({ id, milestone }) => {
    if ((milestone === 1) === listed.includes(id)) return [];
    const where = milestone === 1 ? 'missing from' : 'listed in';
    return [err(`${kind} ${id} has milestone ${milestone} but is ${where} the M1 slice`)];
  });
}

function defined(
  kind: string,
  items: readonly { readonly id: string }[],
  listed: readonly string[],
) {
  const ids = new Set(items.map((x) => x.id));
  return listed.flatMap((id) => (ids.has(id) ? [] : [err(`slice ${kind} '${id}' is not defined`)]));
}

export function checkSlice(c: Content, slice: SliceIds): string[] {
  return [
    ...FLAGGED.flatMap((kind) => flags(kind, c[kind], slice[kind])),
    ...[...FLAGGED, ...UNFLAGGED].flatMap((kind) => defined(kind, c[kind], slice[kind])),
  ];
}
