// A clock tests step by hand (docs/architecture/ui.md "Clock"). Test support only.
import type { Clock } from '../playback.ts';

export interface ManualClock extends Clock {
  /** Moves time forward by `ms` and runs one frame. */
  tick(ms: number): void;
  /** Whether a frame callback is subscribed. */
  running(): boolean;
}

export function manualClock(): ManualClock {
  let t = 0;
  const frames = new Set<(now: number) => void>();
  return {
    now: () => t,
    onFrame(cb) {
      frames.add(cb);
      return () => frames.delete(cb);
    },
    tick(ms) {
      t += ms;
      for (const cb of frames) cb(t);
    },
    running: () => frames.size > 0,
  };
}
