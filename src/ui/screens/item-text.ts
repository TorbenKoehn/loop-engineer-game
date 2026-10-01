// Names and generated lines for items on the reward and discard screens.
import { content } from '../../content/index.ts';
import type { StringKey } from '../../content/strings/en.ts';
import { describeRule, describeTool } from '../../content/text.ts';
import type { OwnedItem } from '../../run/state.ts';
import { t } from '../i18n.ts';

type Version = 1 | 2 | 3;

/** Display name of an item; tools carry their version. */
export function itemName(item: OwnedItem): string {
  if (item.kind === 'tool') {
    const name = t(`tool.${item.tool.id}.name` as StringKey);
    return t('ui.item.tool_version', { name, n: item.tool.version });
  }
  return t(`${item.kind}.${item.id}.name` as StringKey);
}

/** The version a reward card yields: v1 when new, else the owned version + 1 (max v3). */
export const nextVersion = (owned: Version | null): Version =>
  owned === null ? 1 : (Math.min(3, owned + 1) as Version);

/** Generated plain-English lines of a tool at `version`, or of a skill's rules. */
export function itemLines(kind: 'tool' | 'skill', id: string, version: Version = 1): string[] {
  if (kind === 'tool') {
    const def = content.tools.find((d) => d.id === id);
    return def ? [describeTool(def, version)] : [];
  }
  const def = content.skills.find((d) => d.id === id);
  return def ? def.rules.map((r) => describeRule(r)) : [];
}
