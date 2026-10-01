// Harness and system prompt names, lines and flavour (docs/game/content/harnesses.md).
// Spread into `en`. Keys follow `harness.<id>.*` and `prompt.<id>.*`; a prompt's flavour
// is its in-game prompt text. `handler.*` keys describe custom handlers.

export const enHarnesses = {
  'harness.terminal_purist.name': 'Terminal Purist',
  'harness.terminal_purist.line': 'Muscle Memory: tools with weight 3 or less charge rate +10.',
  'harness.terminal_purist.flavour': 'CLI agent. Everything is a pipe.',
  'harness.terminal_purist.difficulty': 'Medium',
  'harness.ide_companion.name': 'IDE Companion',
  'harness.ide_companion.line':
    'Undo Stack: once per fight, when Trust drops below 30%, gain 15 Guardrails.',
  'harness.ide_companion.flavour': 'A pair programmer who lives in your editor.',
  'harness.ide_companion.difficulty': 'Easy',

  'prompt.senior.name': 'Senior',
  'prompt.senior.line': 'All tool damage +10%; window -10.',
  'prompt.senior.flavour': 'You are a senior engineer.',
  'prompt.concise.name': 'Concise',
  'prompt.concise.line': 'All tool outputs -1 (min 0).',
  'prompt.concise.flavour': 'Be concise.',
  'prompt.step_by_step.name': 'Step by Step',
  'prompt.step_by_step.line':
    'The first tool activation each fight resolves twice; all tools charge rate -5.',
  'prompt.step_by_step.flavour': 'Think step by step.',

  'handler.double_first_resolve': 'resolve the first tool activation each fight twice',
} as const;
