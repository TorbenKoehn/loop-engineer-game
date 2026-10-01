// Explicit golden update: reruns the golden tests with GOLDEN_UPDATE=1 so they rewrite
// src/sim/golden/fixtures/. Plain `npm test` never writes goldens. Usage: npm run golden:update
import { spawnSync } from 'node:child_process';

const result = spawnSync('npx vitest run src/sim/golden', {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, GOLDEN_UPDATE: '1' },
});
if (result.status === 0)
  console.log('\n[golden] fixtures rewritten: review the diff of src/sim/golden');
process.exit(result.status ?? 1);
