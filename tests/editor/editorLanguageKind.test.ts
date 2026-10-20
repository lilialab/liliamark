import { describe, expect, it } from 'vitest';
import { editorLanguageKind, supportsMarkdownPreview } from '../../src/editor/languageRegistry';

describe('editorLanguageKind', () => {
  it('maps markdown extensions', () => {
    expect(editorLanguageKind('C:\\Docs\\note.md')).toBe('markdown');
    expect(editorLanguageKind('/tmp/Note.Markdown')).toBe('markdown');
  });

  it('maps json extension', () => {
    expect(editorLanguageKind('C:\\data\\config.json')).toBe('json');
  });

  it('maps script and typed languages', () => {
    expect(editorLanguageKind('a.js')).toBe('javascript');
    expect(editorLanguageKind('a.ts')).toBe('typescript');
    expect(editorLanguageKind('a.jsx')).toBe('jsx');
    expect(editorLanguageKind('a.tsx')).toBe('tsx');
    expect(editorLanguageKind('a.py')).toBe('python');
    expect(editorLanguageKind('a.rs')).toBe('rust');
    expect(editorLanguageKind('A.java')).toBe('java');
    expect(editorLanguageKind('setup.sh')).toBe('shell');
    expect(editorLanguageKind('rc.zsh')).toBe('shell');
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
