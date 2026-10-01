import { check } from './util.ts';
import type { Check } from './util.ts';

const dirs: Check = {
  id: 'dirs',
  run: (ctx) =>
    [...ctx.scan.dirs.entries()].flatMap(([dir, info]) => {
      const where = dir || '.';
      const files = info.files.filter((f) => f !== 'INDEX.md').length;
      const depth = dir ? dir.split('/').length : 0;
      return [
        ...check(ctx, 'dir_files', where, files),
        ...check(ctx, 'dir_subdirs', where, info.subdirs.length),
        ...check(ctx, 'dir_depth', where, depth),
      ];
    }),
};

export const dirChecks: Check[] = [dirs];
