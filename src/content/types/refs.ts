// References from content to code and meta progress.

/** Name of a pure handler in src/sim/handlers (escape hatch, validated). */
export type HandlerId = string;
/** Node of the meta unlock tree, e.g. 'power_tools'. */
export type UnlockId = string;
/** 'base' is in the pool from the first run; otherwise the unlock node that adds it. */
export type UnlockRef = 'base' | { readonly node: UnlockId };
