import { describe, expect, it } from 'vitest';
import { isValidDate, parseFrontmatter, validateDoc } from '../core/frontmatter.ts';
import { matchGlob } from '../core/glob.ts';
import { loadConfig } from '../core/config.ts';
import { readDoc } from '../core/scan.ts';
import { doc, makeRepo } from './testutil.ts';

function check(text: string, rel = 'docs/a.md'): string[] {
  const root = makeRepo({ [rel]: text });
  const config = loadConfig(root);
  const def = config.frontmatter.special.find((s) => matchGlob(rel, s.glob));
  return validateDoc(readDoc(root, rel, config), config, def).map((f) => f.message);
}

describe('frontmatter', () => {
  it('parses a block and body', () => {
    const p = parseFrontmatter('---\ntitle: X\nkeywords: [a, b]\n---\nbody\n');
    expect(p.data).toEqual({ title: 'X', keywords: ['a', 'b'] });
    expect(p.body).toBe('body\n');
  });

  it('reports no frontmatter and bad YAML', () => {
    expect(parseFrontmatter('# hi').data).toBeNull();
    expect(parseFrontmatter('---\na: [\n---\n').error).toMatch(/invalid YAML/);
  });

  it('validates dates strictly', () => {
    expect(isValidDate('2026-10-01')).toBe(true);
    expect(isValidDate('2026-13-01')).toBe(false);
    expect(isValidDate('2026-1-1')).toBe(false);
  });

  it('accepts a valid doc', () => {
    expect(check(doc())).toEqual([]);
  });

  it('flags missing fields, bad enums and bad dates', () => {
    const msgs = check(doc({ status: 'nope', updated: '2026/01/01', type: 'doc' }, '').replace('summary: A summary\n', ''));
    expect(msgs.join('\n')).toMatch(/missing required field "summary"/);
    expect(msgs.join('\n')).toMatch(/status must be one of/);
    expect(msgs.join('\n')).toMatch(/updated must be a YYYY-MM-DD/);
  });

  it('applies type-specific fields for tasks', () => {
    const msgs = check(doc({ type: 'task', status: 'backlog', id: 'T1' }), 'forge/t.md');
    const all = msgs.join('\n');
    expect(all).toMatch(/id "T1" does not match/);
    expect(all).toMatch(/missing required field "epic"/);
    expect(all).toMatch(/missing required field "model"/);
  });

  it('skips CLAUDE.md and requires name/description for skills', () => {
    expect(check('no frontmatter', 'CLAUDE.md')).toEqual([]);
    expect(check('---\nname: x\n---\n', '.claude/skills/x/SKILL.md').join()).toMatch(/description/);
  });
});
