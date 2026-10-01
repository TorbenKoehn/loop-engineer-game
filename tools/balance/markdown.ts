// Markdown rendering of the balance report: one table per metric, rates in percent.
import type { Rate, Report } from './report.ts';

const pct = (x: number): string => `${(x * 100).toFixed(1)}%`;
const rate = (r: Rate): string =>
  `${pct(r.rate)} (${pct(r.ci95[0])}-${pct(r.ci95[1])}, ${r.k}/${r.n})`;
const sec = (ms: number): string => `${(ms / 1000).toFixed(1)} s`;

function table(head: readonly string[], rows: readonly (readonly (string | number)[])[]): string {
  const line = (cells: readonly (string | number)[]): string => `| ${cells.join(' | ')} |`;
  return [line(head), line(head.map(() => '---')), ...rows.map(line)].join('\n');
}

function rateRows(rates: Record<string, Rate>): string[][] {
  return Object.entries(rates).map(([k, r]) => [k, rate(r)]);
}

function itemTable(items: Report['items']): string {
  const rows = Object.entries(items)
    .sort(([a, x], [b, y]) => y.picked - x.picked || (a < b ? -1 : 1))
    .map(([k, i]) => [k, i.offered, i.picked, pct(i.pickRate), rate(i.winWhenPicked)]);
  return table(['Item', 'Offered', 'Picked', 'Pick rate', 'Win when picked (95% CI)'], rows);
}

function fightTable(fights: Report['fights']): string {
  const rows = Object.entries(fights).map(([c, f]) => [
    c,
    f.fights,
    sec(f.medianMs),
    sec(f.p90Ms),
    f.trustLostMean.toFixed(2),
    f.compactionsMean.toFixed(2),
  ]);
  return table(['Class', 'Fights', 'Median', 'p90', 'Trust lost', 'Compactions'], rows);
}

/** The report as Markdown; deterministic for a given report. */
export function reportMarkdown(r: Report): string {
  const c = r.config;
  const seeds = `seeds ${c.seedFrom}-${c.seedFrom + c.runs - 1}`;
  const shares = Object.entries(r.winningLoadoutShare).sort(([, a], [, b]) => b - a);
  const curve = r.creditsCurve.map((p) => [p.step, p.runs, p.mean]);
  const sections: [string, string][] = [
    [
      'Win rate per harness (95% CI)',
      table(['Harness', 'Win rate'], rateRows(r.winRate.byHarness)),
    ],
    [
      'Win rate per harness and prompt',
      table(['Harness/prompt', 'Win rate'], rateRows(r.winRate.byHarnessPrompt)),
    ],
    ['Boss reach', table(['Harness', 'Reached boss'], rateRows(r.bossReach))],
    ['Outcomes', table(['Outcome', 'Runs'], Object.entries(r.outcomes))],
    ['Phase reached', table(['Phase', 'Runs'], Object.entries(r.phaseReached))],
    ['Fights (per fight means)', fightTable(r.fights)],
    [
      'Winning-loadout share per tool',
      table(
        ['Tool', 'Share of wins'],
        shares.map(([t, s]) => [t, pct(s)]),
      ),
    ],
    ['Items', itemTable(r.items)],
    ['Credits curve (mean on the map after n nodes)', table(['Nodes', 'Runs', 'Credits'], curve)],
  ];
  const head = `# Balance report\n\nBot \`${c.bot}\`, phase ${c.phase}, ${c.runs} runs per harness, ${seeds}.\n`;
  return [head, ...sections.map(([title, body]) => `## ${title}\n\n${body}\n`)].join('\n');
}
