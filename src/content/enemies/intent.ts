// Intent builders for enemy data: `[Name: verbs, windupMs]` in the GDD notation.
import type { Intent, Verb, VerbSel } from '../types/enemy.ts';

/** An intent with one or two verbs resolved together after `windupMs`. */
export const intent = (
  id: string,
  windupMs: number,
  ...verbs: readonly [Verb] | readonly [Verb, Verb]
): Intent => ({ id, windupMs, verbs });

export const hit = (n: number): Verb => ({ verb: 'hit', n });
export const noise = (n: number): Verb => ({ verb: 'noise', n });
export const throttle = (sel: VerbSel, ms: number): Verb => ({ verb: 'throttle', sel, ms });
