import { describe, expect, it } from 'vitest';
import {
  hasEditorHighlight,
  supportsHtmlBrowserOpen,
  supportsMarkdownPreview,
  supportsPreviewPanel,
} from '../../src/editor/languageRegistry';

describe('supportsMarkdownPreview', () => {
  it('is true only for markdown paths', () => {
    expect(supportsMarkdownPreview('a.md')).toBe(true);
    expect(supportsMarkdownPreview('Note.Markdown')).toBe(true);
    expect(supportsMarkdownPreview('a.json')).toBe(false);
    expect(supportsMarkdownPreview('a.txt')).toBe(false);
    expect(supportsMarkdownPreview('a.html')).toBe(false);
  });
});

describe('supportsHtmlBrowserOpen', () => {
  it('is true only for html paths', () => {
    expect(supportsHtmlBrowserOpen('a.html')).toBe(true);
    expect(supportsHtmlBrowserOpen('Index.HTM')).toBe(true);
    expect(supportsHtmlBrowserOpen('a.md')).toBe(false);
    expect(supportsHtmlBrowserOpen('a.xml')).toBe(false);
  });
});

describe('supportsPreviewPanel', () => {
  it('covers markdown and html', () => {
    expect(supportsPreviewPanel('a.md')).toBe(true);
    expect(supportsPreviewPanel('a.html')).toBe(true);
    expect(supportsPreviewPanel('a.json')).toBe(false);
  });
});

describe('hasEditorHighlight', () => {
  it('is true for markdown and language-data filenames', () => {
    expect(hasEditorHighlight('C:\\Docs\\note.md')).toBe(true);
    expect(hasEditorHighlight('config.json')).toBe(true);
    expect(hasEditorHighlight('a.yaml')).toBe(true);
    expect(hasEditorHighlight('a.yml')).toBe(true);
    expect(hasEditorHighlight('Cargo.toml')).toBe(true);
    expect(hasEditorHighlight('app.ini')).toBe(true);
    expect(hasEditorHighlight('a.ts')).toBe(true);
    expect(hasEditorHighlight('a.rs')).toBe(true);
  });

  it('is false for unknown text', () => {
    expect(hasEditorHighlight('C:\\Docs\\readme.txt')).toBe(false);
    expect(hasEditorHighlight('C:\\Docs\\Makefile')).toBe(false);
  });
});
