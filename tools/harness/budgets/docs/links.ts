import fs from 'node:fs';
import path from 'node:path';
import { budget } from '../../core/config.ts';
import type { Doc, Finding, Scan } from '../../core/types.ts';
import type { Check } from '../util.ts';
import { linkTargets, splitMd } from './md.ts';

const EXTERNAL = /^(?:[a-z][a-z0-9+.-]*:|#|\/\/)/i;

/** Repo-relative path a link points at, or null for external, anchor-only or placeholder links. */
function resolveLink(doc: Doc, target: string): string | null {
  if (EXTERNAL.test(target) || /[<>{}*]/.test(target)) return null;
  const clean = decodeURI(target.split('#')[0]!.split('?')[0]!);
  if (!clean) return null;
  const abs = clean.startsWith('/') ? clean.slice(1) : path.posix.join(doc.dir, clean);
  return path.posix.normalize(abs);
}

const exists = (scan: Scan, rel: string): boolean => rel.startsWith('..') || fs.existsSync(path.join(scan.root, rel));

function relatedTargets(doc: Doc): string[] {
  const rel = doc.data?.related;
  return Array.isArray(rel) ? rel.filter((r): r is string => typeof r === 'string') : [];
}

const brokenLinks: Check = {
  id: 'broken_links',
  run: (ctx) => {
    const sev = budget(ctx.scan.config, 'broken_links').severity;
    if (sev !== 'error' && sev !== 'warn') return [];
    const out: Finding[] = [];
    for (const doc of ctx.scan.docs) {
      const bad = (what: string, t: string): void => {
        out.push({ file: doc.rel, severity: sev, rule: 'broken_links', message: `${what} does not resolve: ${t}` });
      };
      for (const t of linkTargets(splitMd(doc.body).prose)) {
        const rel = resolveLink(doc, t);
        if (rel !== null && !exists(ctx.scan, rel)) bad('link', t);
      }
      for (const r of relatedTargets(doc)) {
        const rel = resolveLink(doc, r);
        const fromRoot = path.posix.normalize(r.split('#')[0]!);
        if (rel !== null && !exists(ctx.scan, rel) && !exists(ctx.scan, fromRoot)) bad('related path', r);
      }
    }
    return out;
  },
};

export const linkChecks: Check[] = [brokenLinks];
