// Content validation, run in tests (docs/architecture/content-model.md "Validation").
// Returns one message per violation, prefixed with its rule number; [] means valid.

import { UNLOCK_NODES } from './dsl/unlock.ts';
import type { Content } from './index.ts';
import { en, type Strings } from './strings/en.ts';
import type { Milestone } from './types/items.ts';
import { checkNumbers } from './validation/numbers.ts';
import { checkPools } from './validation/pools.ts';
import { checkRefs } from './validation/refs.ts';
import { checkSlice, type SliceIds } from './validation/slice.ts';
import { checkStrings } from './validation/strings.ts';

export type { SliceIds } from './validation/slice.ts';
export { compareSummary, type Summary, summarize } from './validation/summary.ts';

export interface ValidateOptions {
  readonly milestone: Milestone;
  /** The milestone's id lists from the GDD (rule 5). */
  readonly slice: SliceIds;
  readonly strings?: Strings;
  readonly unlockNodes?: readonly string[];
  /** Registered handler ids from src/sim/handlers, once they exist (E007). */
  readonly handlers?: ReadonlySet<string>;
}

/** Rules 1-5. Rule 6 is the summary snapshot (`summarize`, `compareSummary`). */
export function validateContent(c: Content, o: ValidateOptions): string[] {
  const strings = o.strings ?? en;
  const refs = {
    strings,
    unlockNodes: o.unlockNodes ?? UNLOCK_NODES,
    ...(o.handlers ? { handlers: o.handlers } : {}),
  };
  return [
    ...checkRefs(c, refs),
    ...checkNumbers(c),
    ...checkStrings(c, strings),
    ...checkPools(c, o.milestone),
    ...checkSlice(c, o.slice),
  ];
}
