import path from 'node:path';
import { writeBoard } from '../gen/board.ts';
import { hookRoot } from '../core/config.ts';
import { writeIndexes } from '../gen/index.ts';
import { writeBudgetsTable } from '../gen/table.ts';
import { scanRepo } from '../core/scan.ts';
import { parsePayload, readStdin } from './io.ts';

try {
  const payload = parsePayload<{ tool_input: { file_path?: string }; cwd: string }>(await readStdin());
  const file = payload.tool_input?.file_path?.replaceAll('\\', '/');
  const root = hookRoot(payload.cwd);
  if (file && /\.md$|harness\.config\.json$/i.test(file)) {
    const norm = (p: string): string => p.replaceAll('\\', '/');
    const rel = path.posix.relative(norm(root), norm(path.resolve(root, file)));
    if (!rel.startsWith('..') && !path.isAbsolute(rel)) {
      writeBudgetsTable(scanRepo(root));
      writeBoard(scanRepo(root));
      writeIndexes(scanRepo(root));
    }
  }
} catch (e) {
  console.error(`harness post-edit: ${(e as Error).message}`);
}
process.exit(0);
