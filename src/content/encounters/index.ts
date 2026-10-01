// Every encounter, in phase order. Phases 2-3 join with M2 (E012) as their own modules here,
// so the bundle in src/content/index.ts never changes for a new encounter area (T099).
import { phase1Encounters } from './phase1.ts';

export const encounters = [...phase1Encounters] as const;
