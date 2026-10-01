// View-only UI state (open panels, focus, tooltips arrive with their screens).
import { signal } from '@preact/signals';

/** Seed for the next run; random per page load, editable on the title screen. */
export const nextSeed = signal(Math.random().toString(36).slice(2, 10).toUpperCase());
