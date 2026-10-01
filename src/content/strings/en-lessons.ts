// AGENTS.md lesson lines and the custom-handler texts of the two non-numeric lessons.
// Spread into `en`. Keys: `lesson.<id>.line` (written to AGENTS.md); rule text is generated.

export const enLessons = {
  'lesson.bugs_off.line': 'Read the diff before you commit.',
  'lesson.bugs_def.line': 'Reproduce before you fix.',
  'lesson.context_off.line': 'Pin the goal in line one.',
  'lesson.context_def.line': 'Re-read the task when lost.',
  'lesson.infra_off.line': 'Have a fallback for every service.',
  'lesson.infra_def.line': 'Always check rate limits.',
  'lesson.process_off.line': 'Write down the scope.',
  'lesson.process_def.line': 'Say no to quick tiny changes.',
  'lesson.sandbox_off.line': 'Request permissions up front.',
  'lesson.sandbox_def.line': 'Ask before running rm.',

  'handler.context_noise_cut': 'noise from Context enemies is 25% lower (rounded down)',
  'handler.throttle_shorter': 'enemy Throttles on you last 1000 ms less (at least 50 ms)',
} as const;
