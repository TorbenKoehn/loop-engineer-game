import { describe, expect, it } from 'vitest';
import type { ToolDef } from '../../../content/types/index.ts';
import type { CombatEvent } from '../../events.ts';
import { fight, makeTool } from '../../testing/builders.ts';
import { fireTools } from '../fire.ts';
import { createSim, PROGRESS_PER_MS, type Sim, type ToolRt } from '../state.ts';
import { applyStatus } from '../status/statuses.ts';

const piper = (pipeMs: number, id = 'cat'): ToolDef => makeTool({ id, cooldownMs: 1000, pipeMs });

function setup(...defs: ToolDef[]): Sim {
  return createSim(fight({ tools: defs }), true);
}

function slot(sim: Sim, i: number): ToolRt {
  const tool = sim.agent.tools[i];
  if (!tool) throw new Error(`no tool in slot ${i}`);
  return tool;
}

const full = (tool: ToolRt) => tool.def.cooldownMs * PROGRESS_PER_MS;
const fill = (tool: ToolRt) => {
  tool.progress = full(tool);
};
const brief = (e: CombatEvent) => [e.kind, e.src, e.dst];
const pipes = (sim: Sim) => sim.events.filter((e) => e.kind === 'pipe');

describe('pipes', () => {
  it('pipe fills right neighbour', () => {
    const sim = setup(piper(500), makeTool());
    fill(slot(sim, 0));
    slot(sim, 1).progress = 1000 * PROGRESS_PER_MS;
    fireTools(sim);
    expect(slot(sim, 1).progress).toBe(1500 * PROGRESS_PER_MS); // P x 100
    expect(pipes(sim)).toMatchObject([{ src: 't0', dst: 't1', v: 500, d: { chain: 1 } }]);

    // Capped at full: the filled neighbour fires in the same step, right after the pipe.
    const capped = setup(piper(2000), makeTool());
    fill(slot(capped, 0));
    slot(capped, 1).progress = 2500 * PROGRESS_PER_MS;
    fireTools(capped);
    expect(capped.events.map(brief)).toEqual([
      ['toolFired', 't0', undefined],
      ['damage', 't0', 'e1'],
      ['tokens', 't0', 'ctx'],
      ['pipe', 't0', 't1'],
      ['toolFired', 't1', undefined],
      ['damage', 't1', 'e1'],
      ['tokens', 't1', 'ctx'],
    ]);
    expect(slot(capped, 1).progress).toBe(0); // reset, the 1500 ms over full are lost
  });

  it.each([
    ['throttle', 'tool'],
    ['stun', 'tool'],
    ['stun', 'agent'],
  ] as const)('does nothing to a tool under %s on the %s', (status, on) => {
    const sim = setup(piper(500), makeTool());
    applyStatus(sim, 'e1', on === 'tool' ? slot(sim, 1) : sim.agent, { status, ms: 1000 });
    fill(slot(sim, 0));
    fireTools(sim);
    expect(slot(sim, 1)).toMatchObject({ progress: 0, piped: false });
    expect(pipes(sim)).toEqual([]);
  });

  it('never wraps around from the rightmost tool', () => {
    const sim = setup(makeTool(), piper(500));
    fill(slot(sim, 1));
    fireTools(sim);
    expect(slot(sim, 0)).toMatchObject({ progress: 0, piped: false });
    expect(pipes(sim)).toEqual([]);
  });

  it('a tool counts as was piped until its own next activation', () => {
    const sim = setup(piper(500), makeTool());
    const [from, to] = [slot(sim, 0), slot(sim, 1)];
    expect(to.piped).toBe(false);
    fill(from);
    fireTools(sim);
    expect(to.piped).toBe(true);
    sim.t += 50;
    fireTools(sim); // neither tool fires: the flag stays
    expect(to.piped).toBe(true);
    fill(to);
    fireTools(sim);
    expect(to.piped).toBe(false);
    expect(from.piped).toBe(false); // piping out does not mark the source
  });

  it('pipe events carry the 1-based chain step within 1000 ms', () => {
    const sim = setup(piper(1000, 'a'), piper(1000, 'b'), piper(1000, 'c'), makeTool());
    sim.t = 1000;
    fill(slot(sim, 0));
    fireTools(sim); // a fills b, b fills c: one step, three pipes
    sim.t = 1950;
    fill(slot(sim, 2));
    fireTools(sim); // 950 ms after the chain began
    sim.t = 2000;
    fill(slot(sim, 0));
    fireTools(sim); // 1000 ms after: a new chain
    expect(pipes(sim).map((e) => [e.t, e.src, e.d.chain])).toEqual([
      [1000, 't0', 1],
      [1000, 't1', 2],
      [1000, 't2', 3],
      [1950, 't2', 4],
      [2000, 't0', 1],
      [2000, 't1', 2],
      [2000, 't2', 3],
    ]);
  });
});
