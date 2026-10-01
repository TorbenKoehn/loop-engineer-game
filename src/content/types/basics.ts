// Shared vocabulary of the content model (docs/architecture/content-model.md "Core types").

export type Tag = 'Search' | 'Edit' | 'Test' | 'Shell' | 'Web' | 'Agent';
export type Rarity = 'common' | 'uncommon' | 'rare';
export type Family = 'Bugs' | 'Context' | 'Infra' | 'Process' | 'Sandbox';
export type Zone = 'cold' | 'focused' | 'rot' | 'overflow';
/** The timed statuses; Guardrails and Noise are amounts with their own effects. */
export type Status = 'haste' | 'slow' | 'throttle' | 'stun';

/** v1, v2, v3 values of a tool effect. */
export type V3 = readonly [number, number, number];
/** A fixed number or a per-version triple. */
export type Value = V3 | number;

export type TargetSel = 'front' | 'back' | 'lowest' | 'all' | 'self' | 'rightTool' | 'tools';
