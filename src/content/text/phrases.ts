// Noun phrases used inside kind templates: values, targets, selectors, filters, tags.
import type { Strings } from '../strings/en.ts';
import type { Tag, TargetSel, Value } from '../types/basics.ts';
import type { Filter, Selector } from '../types/dsl.ts';
import type { VerbSel } from '../types/enemy.ts';
import { kindKey, nameOf, render } from './fill.ts';

export type Version = 1 | 2 | 3;

/** A fixed value, or the entry of a v1/v2/v3 triple for `version`. */
export const valueAt = (v: Value, version: Version): number =>
  typeof v === 'number' ? v : v[(version - 1) as 0 | 1 | 2];

/** Milliseconds through the `unit.ms` template. */
export const msText = (strings: Strings, ms: number): string =>
  render(strings, 'unit.ms', { n: ms });

/** A modifier amount with an explicit plus sign. */
export const signed = (n: number): string => (n > 0 ? `+${n}` : String(n));

export const tagName = (strings: Strings, tag: Tag): string =>
  render(strings, `tag.${tag.toLowerCase()}`);

export const toolName = (strings: Strings, id: string): string =>
  nameOf(strings, `tool.${id}.name`, id);

export const targetText = (strings: Strings, target: TargetSel): string =>
  render(strings, kindKey('target', target));

/** Recipient of a status or charge effect. */
export function selectorText(strings: Strings, sel: Selector): string {
  if (typeof sel === 'object')
    return render(strings, 'sel.tag', { tag: tagName(strings, sel.tag) });
  switch (sel) {
    case 'fastest':
    case 'leftmost':
    case 'rightmost':
    case 'longestCharge':
      return render(strings, kindKey('sel', sel));
    default:
      return targetText(strings, sel);
  }
}

/** Tools an enemy verb hits; 'all' means all of the agent's tools. */
export const verbSelText = (strings: Strings, sel: VerbSel): string =>
  selectorText(strings, sel === 'all' ? 'tools' : sel);

/** The tools a filter matches, singular ("Edit tool") or plural ("Edit tools"). */
export function filterText(strings: Strings, filter: Filter, plural: boolean): string {
  const form = plural ? 'other' : 'one';
  let what = filter.tag
    ? render(strings, `filter.tag.${form}`, { tag: tagName(strings, filter.tag) })
    : render(strings, `filter.any.${form}`);
  if (filter.tool !== undefined) what = toolName(strings, filter.tool);
  if (filter.maxWeight !== undefined) {
    what = render(strings, 'filter.max_weight', { what, n: filter.maxWeight });
  }
  if (filter.maxCooldownMs !== undefined) {
    const ms = msText(strings, filter.maxCooldownMs);
    what = render(strings, 'filter.max_cooldown', { what, ms });
  }
  if (filter.family !== undefined) {
    const family = render(strings, `family.${filter.family.toLowerCase()}`);
    what = render(strings, 'filter.family', { what, family });
  }
  return what;
}
