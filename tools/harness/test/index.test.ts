import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { generateIndexes, writeIndexes } from '../gen/index.ts';
import { lint } from '../core/lint.ts';
import { scanRepo } from '../core/scan.ts';
import { doc, makeRepo } from './testutil.ts';

const files = {
  'CLAUDE.md': '# entry\n',
  'docs/a.md': doc({ title: 'Alpha', keywords: '[x, y, z]', updated: '2026-09-02' }),
  'docs/sub/b.md': doc({ title: 'Beta | pipe', keywords: '[x, q, r]', updated: '2026-09-05' }),
  '.claude/skills/foo/SKILL.md': '---\nname: foo\ndescription: Does foo\n---\n',
  '.claude/skills/foo/ref.md': 'free-form reference',
  'src/code.ts': 'export const x = 1;\n',
};

describe('index generation', () => {
  it('is deterministic and byte-stable across writes', () => {
    const root = makeRepo(files);
    expect(writeIndexes(scanRepo(root)).length).toBeGreaterThan(0);
    const first = fs.readFileSync(path.join(root, 'docs/INDEX.md'), 'utf8');
    expect(writeIndexes(scanRepo(root))).toEqual([]);
    expect(fs.readFileSync(path.join(root, 'docs/INDEX.md'), 'utf8')).toBe(first);
  });

  it('uses children for updated and aggregates keywords', () => {
    const idx = generateIndexes(scanRepo(makeRepo(files)));
    const docs = idx.get('docs/INDEX.md')!;
    expect(docs).toContain('updated: 2026-09-05');
    expect(docs).toContain('keywords: ["x", "q", "r", "y", "z"]');
    expect(idx.get('docs/sub/INDEX.md')).toContain('Beta \\| pipe');
    expect(docs).toContain('[sub/](sub/INDEX.md)');
  });

  it('skips skill folders and lists skills in skills/INDEX.md', () => {
    const idx = generateIndexes(scanRepo(makeRepo(files)));
    expect(idx.has('.claude/skills/foo/INDEX.md')).toBe(false);
    expect(idx.get('.claude/skills/INDEX.md')).toContain('[foo/SKILL.md](foo/SKILL.md) | foo | Does foo');
    expect(idx.get('INDEX.md')).toContain('Harness entrypoint');
  });

  it('passes lint once generated, and flags stale indexes', () => {
    const root = makeRepo(files);
    expect(lint(scanRepo(root), { now: '2026-10-01', head: () => null }).some((f) => f.rule === 'index')).toBe(true);
    writeIndexes(scanRepo(root));
    fs.writeFileSync(path.join(root, 'forge-placeholder.txt'), 'x');
    const stale = lint(scanRepo(root), { now: '2026-10-01', head: () => null }).filter((f) => f.rule === 'index');
    expect(stale).toEqual([]);
    fs.appendFileSync(path.join(root, 'docs/INDEX.md'), 'tamper\n');
    expect(lint(scanRepo(root), { now: '2026-10-01', head: () => null }).filter((f) => f.rule === 'index')).toHaveLength(1);
  });
});

describe('agents index', () => {
  it('never writes INDEX.md into .claude/agents and lists agents in .claude/INDEX.md', () => {
    const root = makeRepo({ '.claude/agents/a.md': '---\nname: a\ndescription: Agent A\n---\n' });
    writeIndexes(scanRepo(root));
    expect(fs.existsSync(path.join(root, '.claude/agents/INDEX.md'))).toBe(false);
    expect(fs.readFileSync(path.join(root, '.claude/INDEX.md'), 'utf8')).toContain('[agents/a.md](agents/a.md) | a | Agent A');
    fs.writeFileSync(path.join(root, '.claude/agents/INDEX.md'), 'x');
    writeIndexes(scanRepo(root));
    expect(fs.existsSync(path.join(root, '.claude/agents/INDEX.md'))).toBe(false);
  });
});

describe('skill keywords', () => {
  it('fills the Keywords column from metadata.keywords', () => {
    const root = makeRepo({ '.claude/skills/s/SKILL.md': '---\nname: s\ndescription: D\nmetadata:\n  keywords: [alpha, beta]\n---\n' });
    expect(generateIndexes(scanRepo(root)).get('.claude/skills/INDEX.md')).toContain('| alpha, beta |');
  });
});
