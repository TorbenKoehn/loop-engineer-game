import { describe, expect, it } from 'vitest';
import { harnessChoice, RECOMMENDED } from './harness-select.tsx';

const META = { unlocked: [], lessons: [], lintCap: 0 };

describe('harnessChoice (onboarding.md "First-run flow")', () => {
  it('offers both M1 harnesses and preselects and tags IDE Companion on the first run', () => {
    for (const run of [undefined, 0, 1]) {
      const c = harnessChoice({ ...META, run });
      expect(c.pool.map((h) => h.id)).toEqual(['terminal_purist', 'ide_companion']);
      expect(c.initial).toBe(RECOMMENDED);
      expect(c.recommended).toBe(true);
    }
  });

  it('later runs preselect the first harness without the recommended tag', () => {
    const c = harnessChoice({ ...META, run: 2 });
    expect(c.initial).toBe('terminal_purist');
    expect(c.recommended).toBe(false);
  });
});
