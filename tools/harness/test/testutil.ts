import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { CONFIG_NAME } from '../core/config.ts';

const realConfig = path.resolve(import.meta.dirname, '../../..', CONFIG_NAME);

/** Creates a temp repo with the real harness config plus the given files. */
export function makeRepo(files: Record<string, string> = {}): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-'));
  fs.copyFileSync(realConfig, path.join(root, CONFIG_NAME));
  for (const [rel, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), text, 'utf8');
  }
  return root;
}

export function doc(fields: Record<string, string> = {}, body = '# Body\n'): string {
  const base: Record<string, string> = {
    title: 'A title',
    summary: 'A summary',
    keywords: '[one, two, three]',
    type: 'doc',
    status: 'active',
    updated: '2026-09-01',
    ...fields,
  };
  const fm = Object.entries(base).map(([k, v]) => `${k}: ${v}`).join('\n');
  return `---\n${fm}\n---\n${body}`;
}
