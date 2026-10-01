// Combat screen for mode combatReview (screens.md "Combat screen"): replays run.combat with
// the store speed; the playback is disposed when the fight changes or the screen unmounts.
import { useEffect, useMemo } from 'preact/hooks';
import type { CombatRecord } from '../../run/state.ts';
import { loadFight, type Replay } from '../combat/fight.ts';
import { createPlayback, rafClock } from '../combat/playback.ts';
import { Arena } from '../combat/view/arena.tsx';
import { ToolRow } from '../combat/view/tool-row.tsx';
import { ResultStrip, Transport } from '../combat/view/transport.tsx';
import { t } from '../i18n.ts';
import { speed } from '../store/playback.ts';
import { run } from '../store/run.ts';

function openReplay(record: CombatRecord, harness: string): Replay {
  const fight = loadFight(record.input, harness);
  return {
    fight,
    pb: createPlayback({ events: fight.events, start: fight.start, clock: rafClock, speed }),
  };
}

export function CombatScreen() {
  const record = run.value?.combat ?? null;
  const harness = run.value?.setup.harness ?? '';
  const r = useMemo(() => record && openReplay(record, harness), [record, harness]);
  useEffect(() => () => r?.pb.dispose(), [r]);
  if (!r) return null;
  return (
    <section class="panel arena" aria-label={t('ui.combat.region')}>
      <Transport r={r} />
      <Arena r={r} />
      <ToolRow r={r} />
      <ResultStrip r={r} />
    </section>
  );
}
