import { describe, expect, it } from 'vitest';
import { formatClock } from '../i18n.ts';
import { loadFight } from './fight.ts';
import { foldAll } from './fold.ts';
import { createPlayback } from './playback.ts';
import { fightInput } from './testing/fights.ts';
import { manualClock } from './testing/manual-clock.ts';
import { chargeAt, clockTone, DEADLINE_WARN_MS, windupLeft } from './timeline.ts';

describe('timeline', () => {
  it('derives charge from fire times', () => {
    const times = [3000, 6000];
    expect(chargeAt(times, 0, 3000)).toBe(0);
    expect(chargeAt(times, 1500, 3000)).toBeCloseTo(0.5);
    expect(chargeAt(times, 3000, 3000)).toBe(0);
    expect(chargeAt(times, 4500, 3000)).toBeCloseTo(0.5);
    expect(chargeAt(times, 7500, 3000)).toBeCloseTo(0.5);
    expect(chargeAt(times, 60000, 3000)).toBe(0.99);
    expect(chargeAt([], 1000, 4000)).toBeCloseTo(0.25);
    expect(chargeAt([], 1000, 0)).toBe(0);
  });

  it('counts windups down to zero', () => {
    expect(windupLeft({ windupMs: 3000, setAt: 1000 }, 2500)).toBe(1500);
    expect(windupLeft({ windupMs: 3000, setAt: 1000 }, 9000)).toBe(0);
  });
});

describe('Deadline clock', () => {
  const deadline = 45_000;

  it('shows mm:ss.mmm', () => {
    expect(formatClock(deadline - 1)).toBe('00:44.999');
  });

  it('is amber from 10 s before deadlineMs and red after it', () => {
    expect(DEADLINE_WARN_MS).toBe(10_000);
    expect(clockTone(0, deadline)).toBe('ok');
    expect(clockTone(deadline - 10_001, deadline)).toBe('ok');
    expect(clockTone(deadline - 10_000, deadline)).toBe('warn');
    expect(clockTone(deadline, deadline)).toBe('warn');
    expect(clockTone(deadline + 1, deadline)).toBe('over');
  });
});

describe('loadFight', () => {
  it('replays a reference fight from its input through createPlayback', () => {
    const input = fightInput({ harness: 'terminal_purist', encounter: 'p1e1', seed: 'view' });
    const fight = loadFight(input, 'terminal_purist');
    expect(fight.events.at(-1)?.kind).toBe('fightEnd');
    expect(fight.fires).toHaveLength(input.agent.tools.length);
    expect([...fight.labels.values()]).toEqual(['Typo #1', 'Typo #2', 'Typo #3']);
    const clock = manualClock();
    const pb = createPlayback({ events: fight.events, start: fight.start, clock });
    pb.speed.value = 'skip';
    clock.tick(16);
    expect(pb.view.value).toEqual(foldAll(fight.start, fight.events));
    pb.dispose();
  });
});
