import { describe, expect, it } from 'vitest';
import { sameFilePath } from '../../src/utils/sameFilePath';

describe('sameFilePath', () => {
  it('treats Windows paths as case-insensitive and separator-insensitive', () => {
    expect(sameFilePath('C:\\Docs\\note.md', 'c:/Docs/note.md')).toBe(true);
  });

  it('keeps POSIX paths case-sensitive', () => {
    expect(sameFilePath('/Users/me/Note.md', '/Users/me/note.md')).toBe(false);
    expect(sameFilePath('/Users/me/note.md', '/Users/me/note.md')).toBe(true);
  });
});
