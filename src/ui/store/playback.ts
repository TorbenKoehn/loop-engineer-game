// Replay state shared with the shell; the player itself arrives with T058.
import { signal } from '@preact/signals';

/** Persists between fights (screens.md "Controls"); shown in the status bar. */
export const speed = signal<1 | 2 | 4 | 'skip'>(1);
