import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { EN_AREA_MODULES } from '../../src/content/strings/areas.gen.ts';
import {
  areaNames,
  camel,
  exportName,
  REGISTRY_FILE,
  renderRegistry,
  STRINGS_DIR,
  scanAreas,
} from './strings-registry.ts';

describe('content string registry (areas.gen.ts)', () => {
  it('picks only en-<area>.ts modules, sorted', () => {
    const files = ['en.ts', 'en.test.ts', 'en-tools.ts', 'en-yak-shave.ts', REGISTRY_FILE];
    expect(areaNames(files)).toEqual(['tools', 'yak-shave']);
    expect(exportName('yak-shave')).toBe('enYakShave');
  });

  it('lists every en-<area>.ts module on disk (run `npm run content:index` if this fails)', () => {
    expect(Object.keys(EN_AREA_MODULES).sort()).toEqual(scanAreas().map(camel).sort());
    const onDisk = readFileSync(join(STRINGS_DIR, REGISTRY_FILE), 'utf8').replace(/\r\n/g, '\n');
    expect(onDisk).toBe(renderRegistry(scanAreas()));
  });

  it('renders an import, an entry and a spread for a new area', () => {
    const src = renderRegistry(['new-area']);
    expect(src).toContain("import { enNewArea } from './en-new-area.ts';");
    expect(src).toContain('  newArea: enNewArea,');
    expect(src).toContain('  ...enNewArea,');
  });
});
