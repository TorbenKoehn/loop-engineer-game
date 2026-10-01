// Standup event setup lines and choice labels (docs/game/content/events.md). Spread into
// `en`. Keys: `event.<id>.setup` and `event.<id>.choice.<choiceId>`. Outcome text is
// generated from the outcome data. Setup is at most 3 lines.

export const enEvents = {
  'event.quick_tiny_change.speaker': 'The PM',
  'event.quick_tiny_change.setup': '"Can you make a quick tiny change?"\n"Shouldn\'t take long."',
  'event.quick_tiny_change.choice.sure': 'Sure!',
  'event.quick_tiny_change.choice.ask_ticket': 'Ask for a ticket',

  'event.pasted_log.speaker': 'A user',
  'event.pasted_log.setup': 'pastes a 4000-line log\n"Something is wrong."',
  'event.pasted_log.choice.read_all': 'Read all of it',
  'event.pasted_log.choice.ask_relevant': 'Ask for the relevant part',

  'event.underflow_answer.speaker': 'search-bot',
  'event.underflow_answer.setup': 'A Stack Underflow answer from 2011 has 3000 upvotes.',
  'event.underflow_answer.choice.copy_it': 'Copy it',
  'event.underflow_answer.choice.read_comments': 'Read the comments',

  'event.green_locally.speaker': 'A teammate',
  'event.green_locally.setup': '"The tests are green locally."',
  'event.green_locally.choice.ship_it': 'Ship it',
  'event.green_locally.choice.set_up_ci': 'Set up CI properly',
  'event.green_locally.choice.one_more_test': 'Write one more test',
} as const;
