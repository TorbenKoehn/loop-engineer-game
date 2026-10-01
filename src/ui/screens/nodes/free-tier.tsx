// Free Tier screen (screens.md "Other screens"): unboxing a memory. The item card and where it
// lands (equip, stash, or make room) come from a takeTreasure preview of the reducer.
import type { StringKey } from '../../../content/strings/en.ts';
import type { MemoryId } from '../../../content/types/ids.ts';
import type { RunState } from '../../../run/state.ts';
import { t } from '../../i18n.ts';
import { dispatch, preview, run } from '../../store/run.ts';
import { useInitialFocus } from '../focus.ts';
import { itemLines } from '../item-text.ts';

type Unboxed = { id: MemoryId; label: string } | null;

/** The memory takeTreasure would give and the button text for where it goes. */
function unbox(before: RunState, after: RunState): Unboxed {
  const p = after.pending;
  if (p?.kind === 'discard' && p.item.kind === 'memory') {
    return { id: p.item.id, label: t('ui.free.make_room') };
  }
  const slot = after.agent.memories.findIndex((m) => !before.agent.memories.includes(m));
  const equipped = after.agent.memories[slot];
  if (equipped) return { id: equipped, label: t('ui.free.equip', { n: slot + 1 }) };
  const stashed = after.agent.stash.find(
    (i) => i.kind === 'memory' && !before.agent.stash.includes(i),
  );
  return stashed?.kind === 'memory' ? { id: stashed.id, label: t('ui.free.stash') } : null;
}

export function FreeTierScreen() {
  const r = run.value;
  const focus = useInitialFocus<HTMLButtonElement>();
  const after = preview({ t: 'takeTreasure' });
  if (r?.mode !== 'treasure' || !after) return null;
  const box = unbox(r, after);
  return (
    <section class="screen" aria-labelledby="free-title">
      <header class="screen__head">
        <h2 id="free-title">
          <span aria-hidden="true">$ </span>
          {t('ui.free.title')}
        </h2>
        <p class="screen__hint">{t('ui.free.hint')}</p>
      </header>
      {box ? (
        <article class="rcard unbox" data-testid="free-tier-card">
          <span class="rcard__file">{t('ui.free.file', { id: box.id })}</span>
          <span class="rcard__name">{t(`memory.${box.id}.name` as StringKey)}</span>
          <span class="diff">
            {itemLines('memory', box.id).map((line) => (
              <span key={line} class="diff__add">
                <span aria-hidden="true">+ </span>
                {line}
              </span>
            ))}
            <span class="diff__ctx">{t(`memory.${box.id}.flavour` as StringKey)}</span>
          </span>
        </article>
      ) : (
        <p class="screen__hint">{t('ui.free.empty')}</p>
      )}
      <div class="screen__actions">
        <button
          ref={focus}
          type="button"
          class="skip"
          data-testid="free-tier-take"
          onClick={() => dispatch({ t: 'takeTreasure' })}
        >
          {box ? box.label : t('ui.free.leave')}
        </button>
      </div>
    </section>
  );
}
