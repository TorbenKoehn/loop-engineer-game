// Unlock references for content data.
import type { UnlockId, UnlockRef } from '../types/refs.ts';

/** In the pool from the first run. */
export const base = 'base' satisfies UnlockRef;

/**
 * Unlock-tree nodes content may reference (docs/game/systems/meta-progression.md). M1 has
 * these two; the other nodes join with the unlock tree (M2). Checked by validate.ts rule 1.
 */
export const UNLOCK_NODES: readonly UnlockId[] = ['power_tools', 'loop_theory'];

/** Added to the pool by a meta unlock node, e.g. unlockedBy('power_tools'). */
export const unlockedBy = (node: UnlockId): UnlockRef => ({ node });
