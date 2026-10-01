// T056: no raw hex outside the token sheet, self-hosted font budget, zone class encoding.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = join(import.meta.dirname, '..', '..', '..');
const read = (p: string): string => readFileSync(join(root, p), 'utf8');

function files(dir: string, ext: RegExp): string[] {
  return readdirSync(join(root, dir), { withFileTypes: true }).flatMap((e) => {
    const p = `${dir}/${e.name}`;
    return e.isDirectory() ? files(p, ext) : ext.test(e.name) ? [p] : [];
  });
}

describe('theme', () => {
  it('uses raw hex colours only in crimson.css', () => {
    const offenders = files('src', /\.(css|tsx)$/).filter(
      (p) => !p.endsWith('crimson.css') && /#[0-9a-fA-F]{3,8}\b/.test(read(p)),
    );
    expect(offenders).toEqual([]);
  });

  it('self-hosts JetBrains Mono 400/700 within 100 kB at 15px / 1.45', () => {
    const fonts = files('public/fonts', /\.woff2$/);
    expect(fonts.map((f) => f.split('/').pop()).sort()).toEqual([
      'jetbrains-mono-latin-400-normal.woff2',
      'jetbrains-mono-latin-700-normal.woff2',
    ]);
    const bytes = fonts.reduce((n, f) => n + statSync(join(root, f)).size, 0);
    expect(bytes).toBeLessThanOrEqual(100_000);
    const css = read('src/ui/theme/crimson.css');
    expect(css).toMatch(/--size-body:\s*15px/);
    expect(css).toMatch(/--line:\s*1\.45/);
  });

  it('zone classes combine colour, pattern and label', () => {
    const css = read('src/ui/theme/zones.css');
    const want = {
      cold: ['--cold', 'COLD'],
      focused: ['--good', 'FOCUSED'],
      rot: ['--warn', 'ROT'],
      overflow: ['--danger', 'OVERFLOW'],
    };
    for (const [zone, [color, label]] of Object.entries(want)) {
      const block = new RegExp(`\\.zone--${zone}\\s*\\{([^}]*)\\}`).exec(css)?.[1] ?? '';
      expect(block, zone).toContain(`--zone-color: var(${color})`);
      expect(block, zone).toContain(`--zone-label: "${label}"`);
      expect(block, zone).toContain('--zone-pattern:');
    }
  });
});
