// Plain-English Standup outcomes and disabled reasons (events.md "Rules": every choice shows
// its exact outcome before the click). Text only; the run reducer applies the outcomes.
import type { StringKey } from '../../../content/strings/en.ts';
import type { Tag } from '../../../content/types/basics.ts';
import type {
  EventChoice,
  FightModifier,
  Outcome,
  ToolPick,
} from '../../../content/types/event.ts';
import type { ChoiceBlock } from '../../../run/events/standup.ts';
import { t, tPlural } from '../../i18n.ts';

const signed = (n: number): string => (n > 0 ? `+${n}` : String(n));
const tagName = (tag: Tag) => t(`tag.${tag.toLowerCase()}` as StringKey);

/** "your leftmost Search tool", "a random tool below v3". */
function pickText(p: ToolPick): string {
  let what = p.tag ? t('ui.outcome.what.tag', { tag: tagName(p.tag) }) : t('ui.outcome.what.any');
  if (p.maxVersion && p.maxVersion < 3) what = t('ui.outcome.below', { what, n: p.maxVersion + 1 });
  if (p.minVersion && p.minVersion > 1) what = t('ui.outcome.above', { what, n: p.minVersion - 1 });
  return t(`ui.outcome.pick.${p.pick}`, { what });
}

function modText(m: FightModifier): string {
  if (m.mod === 'tagBonus') return t('ui.outcome.tag_bonus', { tag: tagName(m.tag), pct: m.pct });
  if (m.mod === 'startNoise') return t('ui.outcome.start_noise', { n: m.tokens });
  if (m.mod === 'startSignal') return t('ui.outcome.start_signal', { n: m.tokens });
  const enemy = t(`enemy.${m.enemy}.name` as StringKey);
  return tPlural('ui.outcome.add_enemy', m.fights, { count: m.count, enemy });
}

const joined = (outcomes: readonly Outcome[]) => outcomes.map(clause).join('; ');
const amount = (n: number, gain: StringKey, lose: StringKey) =>
  t(n < 0 ? lose : gain, { n: Math.abs(n) });

/** One outcome as a lower-case clause. M2 verbs get their own text with their events (E015). */
function clause(o: Outcome): string {
  switch (o.do) {
    case 'credits':
      return amount(o.n, 'ui.outcome.credits.gain', 'ui.outcome.credits.lose');
    case 'trust':
      return amount(o.n, 'ui.outcome.trust.gain', 'ui.outcome.trust.lose');
    case 'version': {
      const text = t('ui.outcome.version', { tool: pickText(o.tool), n: signed(o.n) });
      return o.otherwise ? t('ui.outcome.otherwise', { text, rest: joined(o.otherwise) }) : text;
    }
    case 'gainTool':
      return o.tool
        ? t('ui.outcome.gain', { name: t(`tool.${o.tool}.name` as StringKey) })
        : t('ui.outcome.gain_tool', {
            rarity: (o.rarity ?? [])
              .map((r) => t(`ui.reward.rarity.${r}`))
              .join(t('ui.outcome.or')),
          });
    case 'slot':
      return t(`ui.outcome.slot.${o.kind}`, { n: signed(o.n) });
    case 'nextFight':
      return modText(o.mod);
    case 'chance':
      return t('ui.outcome.chance', { pct: o.pct, rest: joined(o.then) });
    default:
      return t('ui.outcome.custom');
  }
}

/** One capitalised line per outcome; a choice without outcomes says so. */
export function outcomeLines(outcomes: readonly Outcome[]): string[] {
  if (outcomes.length === 0) return [t('ui.outcome.none')];
  return outcomes.map((o) => clause(o).replace(/^./, (c) => c.toUpperCase()));
}

/** Why a choice is disabled, with the missing amount or tag. */
export function blockText(block: ChoiceBlock, choice: EventChoice, credits: number): string {
  if (block === 'insufficientCredits') {
    return t('ui.standup.need_credits', { n: (choice.cost ?? 0) - credits });
  }
  const tag = (choice.needsTag ?? 'Test').toLowerCase();
  return t('ui.standup.need_tag', { tool: t(`tag.${tag}.indef` as StringKey) });
}
