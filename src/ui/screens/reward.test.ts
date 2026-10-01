import { describe, expect, it } from 'vitest';
import { content } from '../../content/index.ts';
import { newRun } from '../../run/new-run.ts';
import { describeRef } from './discard.tsx';
import { itemLines, itemName, nextVersion } from './item-text.ts';

describe('reward card versions', () => {
  it('a new tool is v1, a duplicate steps up one version and caps at v3', () => {
    expect(nextVersion(null)).toBe(1);
    expect(nextVersion(1)).toBe(2);
    expect(nextVersion(2)).toBe(3);
    expect(nextVersion(3)).toBe(3);
  });

  it('the diff lines come from the generated text of each version', () => {
    const differs = content.tools.some(
      (d) => itemLines('tool', d.id, 1)[0] !== itemLines('tool', d.id, 2)[0],
    );
    expect(differs).toBe(true);
    expect(itemLines('skill', content.skills[0]?.id ?? '').length).toBeGreaterThan(0);
  });
});

describe('discard choices', () => {
  const meta = { unlocked: [], lessons: [], lintCap: 0 };
  const run = newRun({ seed: 'T065', harness: 'terminal_purist', lint: [], tutorial: false }, meta);

  it('names the gained item and each owned slot with its position', () => {
    expect(describeRef(run.agent, { at: 'gained' }, 'Grep v1')).toEqual({
      id: 'discard-gained',
      label: 'Discard the new Grep v1',
    });
    const tool = run.agent.tools[0];
    if (!tool) throw new Error('harness starts with a tool');
    const choice = describeRef(run.agent, { at: 'tool', ix: 0 }, 'Grep v1');
    expect(choice.id).toBe('discard-tool-0');
    expect(choice.label).toBe(`Discard ${itemName({ kind: 'tool', tool })} (tool slot 1)`);
  });
});
