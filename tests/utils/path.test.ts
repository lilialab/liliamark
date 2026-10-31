import { describe, expect, it } from 'vitest';
import { fileExtension, fileName, sameFilePath } from '../../src/utils/path';

describe('sameFilePath', () => {
  it('treats Windows paths as case-insensitive and separator-insensitive', () => {
    expect(sameFilePath('C:\\Docs\\note.md', 'c:/Docs/note.md')).toBe(true);
  });

  it('keeps POSIX paths case-sensitive', () => {
    expect(sameFilePath('/Users/me/Note.md', '/Users/me/note.md')).toBe(false);
    expect(sameFilePath('/Users/me/note.md', '/Users/me/note.md')).toBe(true);
  });
});

describe('fileName', () => {
  it('takes the last segment for Windows and POSIX paths', () => {
    expect(fileName('C:\\Docs\\note.md')).toBe('note.md');
    expect(fileName('/Users/me/note.md')).toBe('note.md');
  });

  it('returns the input when there is no separator', () => {
    expect(fileName('note.md')).toBe('note.md');
  });
});

describe('fileExtension', () => {
  it('returns lowercase extension without the dot', () => {
    expect(fileExtension('C:\\Docs\\Note.MD')).toBe('md');
    expect(fileExtension('/Users/me/a.json')).toBe('json');
  });

  it('returns empty for no extension or leading-dot names', () => {
    expect(fileExtension('Makefile')).toBe('');
    expect(fileExtension('.gitignore')).toBe('');
  });
});
