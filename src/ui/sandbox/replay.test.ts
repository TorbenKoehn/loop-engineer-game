import { describe, expect, it } from 'vitest';
import { foldAll } from './fold.ts';
import { type Clock, createPlayer, runFight } from './player.ts';
import { chargeAt, formatClock, formatSeconds, windupLeft } from './timeline.ts';

const SETUP = { harness: 'terminal_purist', encounter: 'p1e1', seed: 'replay-test' };

/** A clock the test steps by hand. */
function manualClock() {
  let onFrame: ((dt: number) => void) | undefined;
  const clock: Clock = {
    start(cb) {
      onFrame = cb;
      return () => {
        onFrame = undefined;
      };
    },
  };
  return { clock, tick: (dt: number) => onFrame?.(dt), running: () => onFrame !== undefined };
}

describe('sandbox log text', () => {
  it('has one line per event with generated tool and intent text', () => {
    const fight = runFight(SETUP);
    expect(fight.log).toHaveLength(fight.result.events.length);
    const texts = fight.log.map((l) => `${l.actor} ${l.text}`);
    expect(texts).toContain('grep fires (v1): Deal 6 damage to the front enemy.');
    expect(texts).toContain('Typo #2 uses Nitpick: Hit for 2.');
    // The hit amount includes the context zone %, so it comes from the sim's own damage event.
    const grep = `t${fight.input.agent.tools.findIndex((s) => s.def.id === 'grep')}`;
    const hit = fight.result.events.find((e) => e.kind === 'damage' && e.src === grep);
    const grepHits = new RegExp(`^grep hits Typo #1 for ${hit?.v} → Severity \\d+/30$`);
    expect(texts.some((t) => grepHits.test(t))).toBe(true);
    expect(texts.some((t) => /^you take 2 from Typo #3 → Trust \d+\/80$/.test(t))).toBe(true);
    expect(fight.log.at(-1)).toMatchObject({ actor: 'system', tone: 'win' });
    expect(fight.log.at(-1)?.text).toMatch(/^Every issue resolved in \d+\.\d s/);
  });
});

describe('sandbox timeline', () => {
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

  it('formats clock, seconds and windups', () => {
    expect(formatClock(18350)).toBe('00:18.350');
    expect(formatClock(75000)).toBe('01:15.000');
    expect(formatClock(-5)).toBe('00:00.000');
    expect(formatSeconds(3500)).toBe('3.5 s');
    expect(windupLeft({ windupMs: 3000, setAt: 1000 }, 2500)).toBe(1500);
    expect(windupLeft({ windupMs: 3000, setAt: 1000 }, 9000)).toBe(0);
  });
});

describe('sandbox player', () => {
  it('advances by frame time x speed and stops at the end', () => {
    const fight = runFight(SETUP);
    const { clock, tick, running } = manualClock();
    const player = createPlayer(fight, clock);
    player.play();
    expect(player.playing.value).toBe(true);
    tick(500);
    expect(player.time.value).toBe(500);
    player.speed.value = 4;
    tick(500);
    expect(player.time.value).toBe(2500);
    expect(player.view.value.t).toBeLessThanOrEqual(2500);
    for (let i = 0; i < 200 && running(); i++) tick(100);
    expect(player.playing.value).toBe(false);
    expect(player.time.value).toBe(fight.result.endT);
    expect(player.view.value).toEqual(foldAll(fight.start, fight.result.events));
  });

  it('pauses, skips to the end and restarts from zero', () => {
    const fight = runFight(SETUP);
    const { clock, tick, running } = manualClock();
    const player = createPlayer(fight, clock, 2);
    player.play();
    player.play();
    tick(1000);
    player.pause();
    expect(running()).toBe(false);
    tick(1000);
    expect(player.time.value).toBe(2000);
    player.skip();
    expect(player.view.value.end?.outcome).toBe('win');
    player.restart();
    expect(player.time.value).toBe(0);
    expect(player.view.value.end).toBeUndefined();
    expect(player.playing.value).toBe(true);
    player.dispose();
    expect(player.playing.value).toBe(false);
    player.skip();
    player.play();
    expect(player.time.value).toBe(0);
  });
});
