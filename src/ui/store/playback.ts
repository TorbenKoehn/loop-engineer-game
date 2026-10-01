// Replay state shared with the shell; the player is src/ui/combat/playback.ts (pass it `speed`).
import { signal } from '@preact/signals';
import type { Speed } from '../combat/playback.ts';

/** Persists between fights (screens.md "Controls"); shown in the status bar. */
export const speed = signal<Speed>(1);
