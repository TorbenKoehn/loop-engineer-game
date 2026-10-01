import { beforeEach, describe, expect, it } from 'vitest';
import type { Action } from '../../run/actions.ts';
import { legalActions } from '../../run/apply.ts';
import type { RunSetup, RunState } from '../../run/state.ts';
import { actionLog, ctxWindow, dispatch, lastError, mode, run, startRun } from './run.ts';

const SETUP: RunSetup = {
  seed: 'K7Q2-M9XA',
  harness: 'terminal_purist',
  lint: [],
  tutorial: false,
};

describe('run store', () => {
  beforeEach(() => {
    run.value = null;
    lastError.value = null;
    actionLog.value = [];
  });

  it('starts on the title and enters promptPick on a new run', () => {
    expect(mode.value).toBe('title');
    startRun(SETUP);
    expect(mode.value).toBe('promptPick');
    expect(run.value?.setup.seed).toBe('K7Q2-M9XA');
    expect(ctxWindow.value).toBeGreaterThan(0);
  });

  it('dispatch applies a legal action via apply and logs it', () => {
    startRun(SETUP);
    const pick = legalActions(run.value as RunState)[0] as Action;
    dispatch(pick);
    expect(lastError.value).toBeNull();
    expect(mode.value).toBe('map');
    expect(actionLog.value).toEqual([pick]);
  });

  it('a rejected action sets lastError and leaves run unchanged', () => {
    startRun(SETUP);
    const before = run.value;
    dispatch({ t: 'travel', node: 'p1-r1-c0' });
    expect(lastError.value).toBe('wrongMode');
    expect(run.value).toBe(before);
    expect(actionLog.value).toEqual([]);
    dispatch({ t: 'pickPrompt', prompt: 'not_offered' });
    expect(lastError.value).toBe('notOffered');
    expect(run.value).toBe(before);
  });

  it('dispatch without a run is rejected', () => {
    dispatch({ t: 'pickPrompt', prompt: 'senior' });
    expect(lastError.value).toBe('wrongMode');
    expect(run.value).toBeNull();
  });
});
