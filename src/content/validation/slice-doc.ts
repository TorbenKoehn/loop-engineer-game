// Test support: parses the M1 id lists (validation rule 5) from docs/game/vertical-slice.md.
import { content } from '../index.ts';
import { en } from '../strings/en.ts';
import type { SliceIds } from './slice.ts';

const AREAS: Readonly<Record<keyof SliceIds, string>> = {
  tools: 'Tools',
  skills: 'Skills',
  memories: 'Memories',
  events: 'Events',
  encounters: 'Encounters',
  harnesses: 'Harnesses',
  prompts: 'System prompts',
};
const ID = /`([a-z0-9_]+)`(?:–`([a-z0-9_]+)`)?/g;
const NUMBERED = /^(.*?)(\d+)$/;

/** `p1e1`–`p1e5` -> p1e1, ..., p1e5; a single id stays as it is. */
function expand(from: string, to?: string): string[] {
  if (to === undefined) return [from];
  const [, prefix, a] = NUMBERED.exec(from) ?? [];
  const [, toPrefix, b] = NUMBERED.exec(to) ?? [];
  if (prefix === undefined || prefix !== toPrefix || Number(b) < Number(a)) {
    throw new Error(`vertical slice: bad id range ${from}–${to}`);
  }
  return Array.from({ length: Number(b) - Number(a) + 1 }, (_, i) => `${prefix}${Number(a) + i}`);
}

function cellOf(section: string, area: string): string {
  const row = new RegExp(`^\\| ${area}(?: \\(\\d+\\))? \\| (.+) \\|$`, 'm').exec(section);
  if (!row?.[1]) throw new Error(`vertical slice: no "${area}" row`);
  return row[1];
}

/**
 * The M1 id lists from the "In scope" table of a vertical-slice.md text. Harnesses are
 * listed by name; `harnessIdOf` maps a name to its id.
 */
export function parseSliceDoc(md: string, harnessIdOf: (name: string) => string): SliceIds {
  const start = md.indexOf('## In scope');
  const section = md.slice(start, md.indexOf('\n## ', start + 1));
  const ids = (area: string) =>
    [...cellOf(section, area).matchAll(ID)].flatMap((m) => expand(m[1] ?? '', m[2]));
  return {
    tools: ids(AREAS.tools),
    skills: ids(AREAS.skills),
    memories: ids(AREAS.memories),
    events: ids(AREAS.events),
    encounters: ids(AREAS.encounters),
    harnesses: cellOf(section, AREAS.harnesses).split(', ').map(harnessIdOf),
    prompts: ids(AREAS.prompts),
  };
}

const strings = en as Readonly<Record<string, string | undefined>>;

/** Maps a harness name ("Terminal Purist") to its id through `harness.<id>.name`. */
export const harnessIdOf = (name: string): string =>
  content.harnesses.find((h) => strings[`harness.${h.id}.name`] === name)?.id ?? name;

/** The M1 slice lists of a vertical-slice.md text (tests read the file). */
export const sliceOf = (md: string): SliceIds => parseSliceDoc(md, harnessIdOf);
