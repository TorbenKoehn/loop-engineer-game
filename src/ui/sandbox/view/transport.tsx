// Clock, playback controls and the result strip shown after the fight.
import type { Player, Speed } from '../player.ts';
import { formatClock, formatSeconds } from '../timeline.ts';
import { Bar } from './bits.tsx';

const SPEEDS: readonly Speed[] = [1, 2, 4];
/** The clock turns amber this long before the Deadline (screens.md "Clock"). */
const WARN_MS = 10_000;

function clockTone(t: number, deadline: number): string {
  if (t >= deadline) return ' is-over';
  return t >= deadline - WARN_MS ? ' is-warn' : '';
}

export function Transport(props: { player: Player; onSpeed: (s: Speed) => void }) {
  const { player } = props;
  const t = player.time.value;
  const deadline = player.fight.input.encounter.deadlineMs;
  const playing = player.playing.value;
  return (
    <div class="transport">
      <div class="clock">
        <span class={`clock__now${clockTone(t, deadline)}`} data-testid="clock">
          {formatClock(t)}
        </span>
        <span class="clock__of">deadline {formatClock(deadline)}</span>
        <Bar value={t} max={deadline} tone="clock" />
      </div>
      <fieldset class="controls" aria-label="Playback">
        <button
          type="button"
          class="btn btn--play"
          onClick={() => (playing ? player.pause() : player.play())}
        >
          {playing ? '❚❚ pause' : '▶ play'}
        </button>
        {SPEEDS.map((s) => (
          <button
            key={s}
            type="button"
            class="btn btn--speed"
            aria-pressed={player.speed.value === s}
            onClick={() => props.onSpeed(s)}
          >
            {s}x
          </button>
        ))}
        <button type="button" class="btn" onClick={player.skip}>
          ⏭ skip
        </button>
        <button type="button" class="btn" onClick={player.restart}>
          ↺ replay
        </button>
      </fieldset>
    </div>
  );
}

const TITLES = {
  resolved: { icon: '✓', text: 'Resolved' },
  trust: { icon: '✗', text: 'Trust lost' },
  timeout: { icon: '⧗', text: 'Timed out' },
} as const;

export function ResultStrip(props: { player: Player }) {
  const { view, fight } = props.player;
  const { end, agent, tools, enemies } = view.value;
  if (!end) return null;
  const title = TITLES[end.reason];
  const fired = tools.reduce((n, tool) => n + tool.fired, 0);
  const closed = enemies.filter((e) => e.resolvedAt !== undefined).length;
  return (
    <div class={`result result--${end.outcome} result--${end.reason}`} data-testid="result">
      <span class="result__title">
        {title.icon} {title.text}
      </span>
      <span class="result__detail">
        {formatSeconds(end.t)} · −{agent.maxTrust - end.trust} Trust · {fired} tool activations ·{' '}
        {closed}/{enemies.length} issues closed · {fight.result.events.length} events
      </span>
    </div>
  );
}
