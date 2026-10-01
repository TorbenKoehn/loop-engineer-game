const cache = new Map<string, RegExp>();

/** Regex source and consumed length for the glob token at `i`. */
function token(pattern: string, i: number): { re: string; len: number } {
  const c = pattern[i] ?? '';
  if (c === '*' && pattern[i + 1] === '*')
    return pattern[i + 2] === '/' ? { re: '(?:.*/)?', len: 3 } : { re: '.*', len: 2 };
  if (c === '*') return { re: '[^/]*', len: 1 };
  if (c === '?') return { re: '[^/]', len: 1 };
  return { re: c.replace(/[.+^${}()|[\]\\]/g, '\\$&'), len: 1 };
}

function toRegExp(pattern: string): RegExp {
  let re = '';
  for (let i = 0; i < pattern.length; ) {
    const t = token(pattern, i);
    re += t.re;
    i += t.len;
  }
  return new RegExp(`^${re}$`);
}

function compiled(pattern: string): RegExp {
  let re = cache.get(pattern);
  if (!re) {
    re = toRegExp(pattern);
    cache.set(pattern, re);
  }
  return re;
}

/** True if rel matches the glob; "dir/**" also matches "dir" itself. */
export function matchGlob(rel: string, pattern: string): boolean {
  if (compiled(pattern).test(rel)) return true;
  return pattern.endsWith('/**') && compiled(pattern.slice(0, -3)).test(rel);
}

export function matchAny(rel: string, patterns: string[]): boolean {
  return patterns.some((p) => matchGlob(rel, p));
}
