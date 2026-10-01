import fs from 'node:fs';
import path from 'node:path';
import { loadConfig } from './config.ts';
import { parseFrontmatter } from './frontmatter.ts';
import { matchAny, matchGlob } from './glob.ts';
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

interface Walk {
  root: string;
  config: Config;
  docs: Doc[];
  code: Scan['code'];
  dirs: Map<string, DirInfo>;
}

/** Records a file in its directory and, if it is a doc or code file, in the scan. */
function visitFile(w: Walk, info: DirInfo, name: string, childRel: string): void {
  info.files.push(name);
  if (name.endsWith('.md')) w.docs.push(readDoc(w.root, childRel, w.config));
  else if (name.endsWith('.ts') && matchAny(childRel, w.config.codeGlobs)) {
    const text = fs.readFileSync(path.join(w.root, childRel), 'utf8').replace(/\r\n/g, '\n');
    w.code.push({ rel: childRel, text });
  }
}

function walkDir(w: Walk, rel: string): void {
  const info: DirInfo = { files: [], subdirs: [] };
  w.dirs.set(rel, info);
  for (const e of sortedEntries(path.join(w.root, rel))) {
    const childRel = rel ? `${rel}/${e.name}` : e.name;
    if (matchAny(childRel, w.config.exclude)) continue;
    if (e.isDirectory()) {
      info.subdirs.push(e.name);
      walkDir(w, childRel);
    } else if (e.isFile()) visitFile(w, info, e.name, childRel);
  }
}

export function scanRepo(root: string, config: Config = loadConfig(root)): Scan {
  const w: Walk = { root, config, docs: [], code: [], dirs: new Map() };
  walkDir(w, '');
  return { root, config, docs: w.docs, code: w.code, dirs: w.dirs };
}
