import { describe, expect, it } from 'vitest';
import { formatKindForPath, supportsDocumentFormat } from '../../src/editor/formatDocument';

describe('formatKindForPath', () => {
  it('maps json and markdown extensions', () => {
    expect(formatKindForPath('a.json')).toBe('json');
    expect(formatKindForPath('a.jsonc')).toBe('json');
    expect(formatKindForPath('a.md')).toBe('markdown');
    expect(formatKindForPath('Note.Markdown')).toBe('markdown');
    expect(formatKindForPath('a.yaml')).toBe(null);
    expect(formatKindForPath('a.txt')).toBe(null);
  });
});

describe('supportsDocumentFormat', () => {
  it('is true when formatKindForPath is non-null', () => {
    expect(supportsDocumentFormat('a.json')).toBe(true);
    expect(supportsDocumentFormat('a.jsonc')).toBe(true);
    expect(supportsDocumentFormat('a.md')).toBe(true);
    expect(supportsDocumentFormat('Note.Markdown')).toBe(true);
    expect(supportsDocumentFormat('a.yaml')).toBe(false);
    expect(supportsDocumentFormat('a.txt')).toBe(false);
  });
});
