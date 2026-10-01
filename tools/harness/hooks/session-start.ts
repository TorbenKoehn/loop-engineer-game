import fs from 'node:fs';
import path from 'node:path';
import { budget, hookRoot } from '../core/config.ts';
import { forgeItems, ofType } from '../core/forge.ts';
import { scanRepo } from '../core/scan.ts';
import { parsePayload, readStdin } from './io.ts';

const BRIEF = 'docs/harness/orchestrator.md';

function boardSummary(root: string): string {
  const { config, docs } = scanRepo(root);
  const items = forgeItems(docs);
  const tasks = ofType(items, 'task');
  const n = (status: string): number => tasks.filter((t) => t.status === status).length;
  const epics = ofType(items, 'epic').filter((e) => e.status === 'in-progress').length;
  return [
    'Board:',
    `in-progress ${n('in-progress')}/${budget(config, 'wip_in_progress').value},`,
    `review ${n('review')}/${budget(config, 'wip_review').value},`,
    `blocked ${n('blocked')}, ready ${n('ready')}, backlog ${n('backlog')}, done ${n('done')};`,
    `active epics ${epics}/${budget(config, 'epics_active').value}`,
  ].join(' ');
}

const payload = parsePayload<{ cwd: string }>(await readStdin());
try {
  const root = hookRoot(payload.cwd);
  const brief = path.join(root, BRIEF);
  // Plain stdout of a SessionStart hook (exit 0) is added to the session context.
  if (fs.existsSync(brief)) console.log(fs.readFileSync(brief, 'utf8').trimEnd(), '\n');
  console.log(boardSummary(root));
} catch (e) {
  console.error(`harness session-start: ${(e as Error).message}`);
}
process.exit(0);
