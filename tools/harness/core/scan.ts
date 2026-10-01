import fs from 'node:fs';
import path from 'node:path';
import { matchAny, matchGlob } from './glob.ts';
import { parseFrontmatter } from './frontmatter.ts';
import { loadConfig } from './config.ts';
import type { Config, DirInfo, Doc, DocKind, Scan } from './types.ts';

export function countLines(text: string): number {
  if (text === '') return 0;
  const n = text.split('\n').length;
  return text.endsWith('\n') ? n - 1 : n;
}

export function classify(rel: string, config: Config): DocKind {
  const hit = config.frontmatter.special.find((s) => matchGlob(rel, s.glob));
  return hit ? hit.kind : 'doc';
}

export function readDoc(root: string, rel: string, config: Config): Doc {
  const raw = fs.readFileSync(path.join(root, rel), 'utf8').replace(/\r\n/g, '\n');
  const parsed = parseFrontmatter(raw);
  const slash = rel.lastIndexOf('/');
  return {
    rel,
    dir: slash < 0 ? '' : rel.slice(0, slash),
    kind: classify(rel, config),
    raw,
    lines: countLines(raw),
    data: parsed.data,
    body: parsed.body,
    parseError: parsed.error,
  };
}

function sortedEntries(abs: string): fs.Dirent[] {
  return fs.readdirSync(abs, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1));
}

export function scanRepo(root: string, config: Config = loadConfig(root)): Scan {
  const docs: Doc[] = [];
  const code: Scan['code'] = [];
  const dirs = new Map<string, DirInfo>();

  const walk = (rel: string): void => {
    const info: DirInfo = { files: [], subdirs: [] };
    dirs.set(rel, info);
    for (const e of sortedEntries(path.join(root, rel))) {
      const childRel = rel ? `${rel}/${e.name}` : e.name;
      if (matchAny(childRel, config.exclude)) continue;
      if (e.isDirectory()) {
        info.subdirs.push(e.name);
        walk(childRel);
      } else if (e.isFile()) {
        info.files.push(e.name);
        if (e.name.endsWith('.md')) docs.push(readDoc(root, childRel, config));
        else if (e.name.endsWith('.ts') && matchAny(childRel, config.codeGlobs)) {
          code.push({ rel: childRel, text: fs.readFileSync(path.join(root, childRel), 'utf8').replace(/\r\n/g, '\n') });
        }
      }
    }
  };
  walk('');
  return { root, config, docs, code, dirs };
}
