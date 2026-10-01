// Replay state shared with the shell; the player is src/ui/combat/playback.ts (pass it `speed`).
import { signal } from '@preact/signals';
import type { CtxView } from '../combat/context.ts';
import type { Replay } from '../combat/fight.ts';
import type { Speed } from '../combat/playback.ts';

/** Persists between fights (screens.md "Controls"); shown in the status bar. */
export const speed = signal<Speed>(1);

/** Context bar of the open fight (live W and F), for the status bar; null outside a fight. */
export const ctxLive = signal<CtxView | null>(null);

/** The open fight and its playback, for the terminal's combat log; null outside a fight. */
export const replayLive = signal<Replay | null>(null);
