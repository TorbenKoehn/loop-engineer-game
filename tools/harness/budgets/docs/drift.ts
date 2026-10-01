import fs from 'node:fs';
import path from 'node:path';
import { matchGlob } from '../../core/glob.ts';
import type { Doc, Finding } from '../../core/types.ts';
import type { Check, Ctx } from '../util.ts';
import { splitMd } from './md.ts';

const warn = (file: string, rule: string, message: string): Finding => ({
  file,
  severity: 'warn',
  rule,
  message,
});

function allFiles(ctx: Ctx): string[] {
  return [...ctx.scan.dirs.entries()].flatMap(([dir, info]) =>
    info.files.map((f) => (dir ? `${dir}/${f}` : f)),
  );
}

/** Files matched by a related_code entry: glob, exact file or directory prefix. */
export function matchRelatedCode(files: string[], entry: string): string[] {
  const p = entry.replaceAll('\\', '/').replace(/^\.\//, '').replace(/\/$/, '');
  return files.filter((f) => matchGlob(f, p) || f.startsWith(`${p}/`));
}

function driftFor(ctx: Ctx, doc: Doc, files: string[]): Finding[] {
  const codes = doc.data?.related_code;
  const updated = doc.data?.updated;
  if (!Array.isArray(codes) || typeof updated !== 'string') return [];
  return codes.flatMap((entry) => driftForEntry(ctx, doc, files, String(entry)));
}

function driftForEntry(ctx: Ctx, doc: Doc, files: string[], entry: string): Finding[] {
  const updated = String(doc.data?.updated);
  const hits = matchRelatedCode(files, entry);
  if (hits.length === 0)
    return [warn(doc.rel, 'doc_drift', `related_code matches no file: ${entry}`)];
  const out: Finding[] = [];
  for (const f of hits) {
    const date = ctx.lastCommit(f);
    if (date && date > updated)
      out.push(warn(doc.rel, 'doc_drift', `${f} changed ${date}, doc updated ${updated}`));
  }
  return out;
}

const NPM_RUN = /\bnpm run ([\w:.-]+)/g;

function missingScripts(doc: Doc, scripts: Set<string>): Finding[] {
  const text = [...splitMd(doc.body).prose, doc.body].join('\n');
  const names = new Set(
    [...text.matchAll(NPM_RUN)].map((m) => m[1]!).filter((n) => !/[:.-]$/.test(n)),
  );
  return [...names]
    .filter((n) => !scripts.has(n))
    .map((n) =>
      warn(doc.rel, 'npm_script', `mentions "npm run ${n}" but package.json has no such script`),
    );
}

function packageScripts(ctx: Ctx): Set<string> | null {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(ctx.scan.root, 'package.json'), 'utf8')) as {
      scripts?: Record<string, string>;
    };
    return new Set(Object.keys(pkg.scripts ?? {}));
  } catch {
    return null;
  }
}

const drift: Check = {
  id: 'doc_drift',
  run: (ctx) => {
    const files = allFiles(ctx);
    const scripts = packageScripts(ctx);
    return ctx.scan.docs.flatMap((d) => {
      const code = driftFor(ctx, d, files);
      const skip =
        ['research', 'task', 'epic'].includes(String(d.data?.type)) ||
        d.kind === 'index' ||
        d.data?.generated === true;
      return [...code, ...(scripts && !skip ? missingScripts(d, scripts) : [])];
    });
  },
};

export const driftChecks: Check[] = [drift];
