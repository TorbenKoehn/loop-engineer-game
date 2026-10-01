// Random bot: uniform over the legal actions (fuzzing), seeded by the run seed.
import { pick } from '../../../src/sim/rng.ts';
import { type Bot, botRng } from './bot.ts';

export const randomBot: Bot = (state, legal) => pick(botRng(state, 'random'), legal);
