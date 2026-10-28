import { describe, expect, it } from 'vitest';
import { normalizeUntitledExt, parseUntitledExt, tabLanguagePath } from '../../src/utils/untitled';

describe('normalizeUntitledExt', () => {
  it('normalizes known and custom extensions', () => {
    expect(normalizeUntitledExt('MD')).toBe('md');
    expect(normalizeUntitledExt('.json')).toBe('json');
    expect(normalizeUntitledExt('rs')).toBe('rs');
    expect(normalizeUntitledExt('tar.gz')).toBe('tar.gz');
  });

  it('rejects empty or illegal values', () => {
    expect(normalizeUntitledExt('')).toBeNull();
    expect(normalizeUntitledExt('...')).toBeNull();
    expect(normalizeUntitledExt('a/b')).toBeNull();
    expect(normalizeUntitledExt('a b')).toBeNull();
  });
});

describe('parseUntitledExt', () => {
  it('falls back to md when normalize fails', () => {
    expect(parseUntitledExt('')).toBe('md');
    expect(parseUntitledExt('a/b')).toBe('md');
  });
});

describe('tabLanguagePath', () => {
  it('returns real path when present', () => {
    expect(tabLanguagePath({ path: 'C:\\a.md', untitledExt: 'txt' })).toBe('C:\\a.md');
  });

  it('builds untitled pseudo-path from extension', () => {
    expect(tabLanguagePath({ path: null, untitledExt: 'json' })).toBe('untitled.json');
    expect(tabLanguagePath({ path: null, untitledExt: 'rs' })).toBe('untitled.rs');
  });
});
