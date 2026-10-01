// Meta progress the UI passes to newRun. A fresh profile until saves load it (E008).
import { signal } from '@preact/signals';
import type { MetaView } from '../../run/state.ts';

export const meta = signal<MetaView>({ unlocked: [], lessons: [], lintCap: 0 });
