// Import boundary: sim imports only src/sim and src/content/types*.
// No DOM, Date, Math.random, timers or window. See docs/architecture/overview.md.
export const SIM_VERSION = 1;

export { type BreakpointProgress, breakpoints } from './breakpoints.ts';
export { resolveCombat } from './combat/tick/resolve.ts';
export type * from './combat/types.ts';
