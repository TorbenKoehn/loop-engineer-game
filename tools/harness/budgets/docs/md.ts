export interface Fence {
  lang: string;
  lines: number;
}

export interface MdParts {
  /** Lines outside fenced code blocks. */
  prose: string[];
  fences: Fence[];
}

/** Split a Markdown body into prose lines and fenced blocks (``` or ~~~). */
export function splitMd(body: string): MdParts {
  const prose: string[] = [];
  const fences: Fence[] = [];
  let open: { mark: string; fence: Fence } | null = null;
  for (const line of body.split('\n')) {
    const m = /^\s*(`{3,}|~{3,})\s*([\w-]*)/.exec(line);
    if (open) {
      if (m && m[1]!.startsWith(open.mark) && !m[2]) open = null;
      else open.fence.lines++;
    } else if (m) {
      const fence = { lang: m[2]!.toLowerCase(), lines: 0 };
      fences.push(fence);
      open = { mark: m[1]!.slice(0, 3), fence };
    } else prose.push(line);
  }
  return { prose, fences };
}

export function headingLevels(prose: string[]): number[] {
  return prose.flatMap((l) => {
    const m = /^(#{1,6})\s+\S/.exec(l);
    return m ? [m[1]!.length] : [];
  });
}

const INLINE_CODE = /`[^`]*`/g;
const LINK = /\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g;
const REF_DEF = /^\s*\[[^\]]+\]:\s*<?(\S+?)>?(?:\s+"[^"]*")?\s*$/;

/** Link targets in prose: inline links and reference definitions. */
export function linkTargets(prose: string[]): string[] {
  const out: string[] = [];
  for (const line of prose) {
    const ref = REF_DEF.exec(line);
    if (ref) out.push(ref[1]!);
    for (const m of line.replace(INLINE_CODE, '').matchAll(LINK)) out.push(m[1]!);
  }
  return out;
}
