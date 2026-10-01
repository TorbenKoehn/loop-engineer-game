// Every enemy definition, in phase order. Copy-Paste Clone joins with M2 (E012).
import { monolithEnemies } from './legacy-monolith.ts';
import { phase1Enemies } from './phase1.ts';
import { yakShaveEnemies } from './yak-shave.ts';

export const enemies = [...phase1Enemies, ...yakShaveEnemies, ...monolithEnemies] as const;

/** Literal union of every defined enemy id. */
export type DefinedEnemyId = (typeof enemies)[number]['id'];
