// Regenerates src/content/strings/areas.gen.ts from the en-<area>.ts files on disk.
// Usage: npm run content:index (after adding or removing a strings module, or on a merge
// conflict in areas.gen.ts). Writes only on change.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { REGISTRY_FILE, renderRegistry, STRINGS_DIR, scanAreas } from './strings-registry.ts';

const path = join(STRINGS_DIR, REGISTRY_FILE);
const areas = scanAreas();
const next = renderRegistry(areas);
let prev = '';
try {
  prev = readFileSync(path, 'utf8');
} catch {
  // First run: no registry yet.
}
if (prev === next) {
  console.log(`[content] ${REGISTRY_FILE} up to date (${areas.length} areas)`);
} else {
  writeFileSync(path, next);
  console.log(`[content] wrote ${REGISTRY_FILE} (${areas.length} areas: ${areas.join(', ')})`);
}
