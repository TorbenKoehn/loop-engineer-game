// Pure checkers for the architecture rules (docs/architecture/overview.md, ADR-006).
// Operate on in-memory sources so negative fixtures need no files.

export type Module =
  | 'sim'
  | 'content'
  | 'run'
  | 'save'
  | 'ui'
  | 'render-fx'
  | 'audio'
  | 'debug'
  | 'tools/balance';

/** One row per module: the modules it may import from (itself is always allowed). */
export const ALLOWED: Record<Module, readonly Module[]> = {
  sim: ['content'],
  content: [],
  run: ['content', 'sim'],
  save: ['content', 'run'],
  ui: ['content', 'sim', 'run', 'save', 'render-fx', 'audio'],
  'render-fx': ['sim'],
  audio: ['sim'],
  debug: ['content', 'sim', 'run', 'save'],
  'tools/balance': ['content', 'sim', 'run', 'save'],
};

/** Sub-paths of src/content that sim may import (types and DSL definitions, never data). */
const SIM_CONTENT_OK = /^src\/content\/(types|dsl)(\/|\.|$)/;
/** Bare (package) specifiers a module may use in non-test code. */
const BARE_OK: Partial<Record<Module, RegExp>> = {
  ui: /^(preact|@preact\/signals)(\/|$)/,
  audio: /^zzfx$/,
  'tools/balance': /^node:/,
};
const PURE: readonly Module[] = ['sim', 'run'];
/** Free reference to a global: not a property access (`x.window`) nor an object key (`window:`). */
function freeRef(names: string): RegExp {
  return new RegExp(`(?<![\\w$.])(?:${names})\\b(?!\\s*\\??:)`);
}
const BANNED_GLOBALS: readonly [string, RegExp][] = [
  ['Math.random', /\bMath\s*\.\s*random\b/],
  ['Date', freeRef('Date')],
  ['performance', freeRef('performance')],
  ['timers', freeRef('setTimeout|setInterval|setImmediate|requestAnimationFrame')],
  ['window', freeRef('window')],
  ['document', freeRef('document')],
  ['crypto', freeRef('crypto')],
];
const IMPORT_RE =
  /\b(?:import|export)\s[^'"`;]*?\bfrom\s*['"]([^'"]+)['"]|\bimport\s*['"]([^'"]+)['"]|\bimport\(\s*['"]([^'"]+)['"]\s*\)/g;

export function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '$1');
}

/** Module a repo-relative posix path belongs to, or undefined (not a governed module). */
export function moduleOf(path: string): Module | undefined {
  if (path.startsWith('tools/balance/')) return 'tools/balance';
  const m = /^src\/([^/]+)\//.exec(path);
  const name = m?.[1] as Module | undefined;
  return name && name in ALLOWED ? name : undefined;
}

export function isTestFile(path: string): boolean {
  return /\.test\.tsx?$/.test(path);
}

export function specifiers(src: string): string[] {
  const out: string[] = [];
  for (const m of stripComments(src).matchAll(IMPORT_RE))
    out.push((m[1] ?? m[2] ?? m[3]) as string);
  return out;
}

function resolve(from: string, spec: string): string {
  const parts = from.split('/').slice(0, -1);
  for (const seg of spec.split('/')) {
    if (seg === '..') parts.pop();
    else if (seg !== '.') parts.push(seg);
  }
  return parts.join('/');
}

function checkRelative(path: string, mod: Module, spec: string): string | undefined {
  if (!/\.tsx?$/.test(spec))
    return `${path}: import '${spec}' needs an explicit .ts/.tsx extension (ADR-006)`;
  const target = resolve(path, spec);
  const to = moduleOf(target);
  if (!to || to === mod) return undefined;
  if (!ALLOWED[mod].includes(to) || (mod === 'sim' && !SIM_CONTENT_OK.test(target)))
    return `${path}: forbidden import ${mod} -> ${to} ('${spec}')`;
  return undefined;
}

/** Violations of the dependency table and ADR-006 style for one source file. */
export function checkImports(path: string, src: string): string[] {
  const mod = moduleOf(path);
  if (!mod) return [];
  const test = isTestFile(path);
  const out: string[] = [];
  for (const spec of specifiers(src)) {
    if (/^\.\.?\//.test(spec)) {
      const v = checkRelative(path, mod, spec);
      if (v) out.push(v);
    } else if (!test && !BARE_OK[mod]?.test(spec)) {
      out.push(`${path}: ${mod} may not import '${spec}' (aliases/packages not allowed)`);
    }
  }
  return out;
}

/** Banned nondeterministic globals in src/sim and src/run (non-test files). */
export function checkGlobals(path: string, src: string): string[] {
  const mod = moduleOf(path);
  if (!mod || !PURE.includes(mod) || isTestFile(path)) return [];
  const code = stripComments(src);
  return BANNED_GLOBALS.filter(([, re]) => re.test(code)).map(
    ([name]) => `${path}: banned global '${name}' in src/${mod}`,
  );
}
