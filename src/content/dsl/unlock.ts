// Unlock references for content data.
import type { UnlockId, UnlockRef } from '../types/refs.ts';

/** In the pool from the first run. */
export const base = 'base' satisfies UnlockRef;

/** Added to the pool by a meta unlock node, e.g. unlockedBy('power_tools'). */
export const unlockedBy = (node: UnlockId): UnlockRef => ({ node });
