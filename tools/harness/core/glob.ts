const cache = new Map<string, RegExp>();

function toRegExp(pattern: string): RegExp {
  let re = '';
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i]!;
    if (c === '*' && pattern[i + 1] === '*') {
      if (pattern[i + 2] === '/') {
        re += '(?:.*/)?';
        i += 2;
      } else {
        re += '.*';
        i += 1;
      }
    } else if (c === '*') re += '[^/]*';
    else if (c === '?') re += '[^/]';
    else re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
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
