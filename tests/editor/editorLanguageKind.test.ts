import { describe, expect, it } from 'vitest';
import { editorLanguageKind, supportsMarkdownPreview } from '../../src/editor/editorLanguageKind';

describe('editorLanguageKind', () => {
  it('maps markdown extensions', () => {
    expect(editorLanguageKind('C:\\Docs\\note.md')).toBe('markdown');
    expect(editorLanguageKind('/tmp/Note.Markdown')).toBe('markdown');
  });

  it('maps json extension', () => {
    expect(editorLanguageKind('C:\\data\\config.json')).toBe('json');
  });

  it('treats other paths as plaintext', () => {
    expect(editorLanguageKind('C:\\Docs\\readme.txt')).toBe('plaintext');
    expect(editorLanguageKind('C:\\Docs\\Makefile')).toBe('plaintext');
  });
});

describe('supportsMarkdownPreview', () => {
  it('is true only for markdown paths', () => {
    expect(supportsMarkdownPreview('a.md')).toBe(true);
    expect(supportsMarkdownPreview('a.json')).toBe(false);
    expect(supportsMarkdownPreview('a.txt')).toBe(false);
  });
});
