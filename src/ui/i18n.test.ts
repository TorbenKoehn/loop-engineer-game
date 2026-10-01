import { afterEach, describe, expect, it, vi } from 'vitest';
import type { StringKey } from '../content/strings/en.ts';
import { fmtSeconds, formatClock, t, tPlural } from './i18n.ts';

describe('t()', () => {
  afterEach(() => vi.restoreAllMocks());

  it('reads en.ts and fills named placeholders', () => {
    expect(t('ui.title.new_run')).toBe('New run');
    expect(t('ui.shell.breadcrumb', { phase: 1, name: 'implement' })).toBe('phase-1/implement');
    expect(t('effect.dmg', { n: 6, target: 'the front enemy' })).toBe(
      'deal 6 damage to the front enemy',
    );
    expect(t('ui.status.phase', { phase: 1200 })).toBe('P1,200');
  });

  it('a missing key renders the key and fails a dev assertion', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(t('ui.nope.missing' as StringKey)).toBe('ui.nope.missing');
    expect(error).toHaveBeenCalledOnce();
    expect(String(error.mock.calls[0]?.[0])).toContain('missing string key "ui.nope.missing"');
  });

  it('a missing param keeps its placeholder and fails a dev assertion', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(t('ui.shell.seed')).toBe('seed {seed}');
    expect(error).toHaveBeenCalledOnce();
  });
});

describe('formatClock', () => {
  it('formats integer sim ms as mm:ss.mmm', () => {
    expect(formatClock(12_350)).toBe('00:12.350');
    expect(formatClock(0)).toBe('00:00.000');
    expect(formatClock(61_005)).toBe('01:01.005');
    expect(formatClock(-5)).toBe('00:00.000');
  });
});

describe('tPlural and fmtSeconds', () => {
  it('picks the .one or .other form by count', () => {
    expect(tPlural('ui.combat.compactions', 1)).toBe('1 compaction');
    expect(tPlural('ui.combat.compactions', 0)).toBe('0 compactions');
    expect(tPlural('ui.combat.compactions', 2)).toBe('2 compactions');
  });

  it('formats sim ms as seconds with one decimal', () => {
    expect(fmtSeconds(27_400)).toBe('27.4 s');
    expect(fmtSeconds(3000)).toBe('3.0 s');
    expect(fmtSeconds(-5)).toBe('0.0 s');
  });
});
