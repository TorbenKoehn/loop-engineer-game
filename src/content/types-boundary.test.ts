// AC: src/content/types imports nothing outside src/content (sim may import it).
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const contentDir = dirname(fileURLToPath(import.meta.url));
const typesDir = join(contentDir, 'types');
const SPECIFIER = /\b(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g;

function specifiers(file: string): string[] {
  const src = readFileSync(file, 'utf8');
  return [...src.matchAll(SPECIFIER)].map((m) => m[1] ?? '');
}

describe('src/content/types import boundary', () => {
  const files = readdirSync(typesDir).filter((f) => f.endsWith('.ts'));

  it('finds the type modules', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it('imports only relative .ts modules inside src/content', () => {
    for (const file of files) {
      for (const spec of specifiers(join(typesDir, file))) {
        expect(spec.startsWith('.'), `${file}: ${spec} must be relative`).toBe(true);
        expect(spec.endsWith('.ts'), `${file}: ${spec} needs a .ts extension`).toBe(true);
        const target = relative(contentDir, resolve(typesDir, spec));
        expect(target.startsWith('..'), `${file}: ${spec} leaves src/content`).toBe(false);
      }
    }
  });
});
