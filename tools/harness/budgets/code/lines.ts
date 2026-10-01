export const isTest = (rel: string): boolean => /\.test\.ts$/.test(rel);

export const isComment = (line: string): boolean => /^\s*(?:\/\/|\/\*|\*)/.test(line);

export function commentLines(text: string): number {
  return text.split('\n').filter(isComment).length;
}

/** Non-blank, non-comment lines. */
export function codeLines(text: string): number {
  return text.split('\n').filter((l) => l.trim() !== '' && !isComment(l)).length;
}
