import { describe, expect, it } from 'vitest';
import {
  completeUntitledExt,
  normalizeUntitledExt,
  parseUntitledExt,
  suggestUntitledExt,
  tabLanguagePath,
} from '../../src/utils/untitled';

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

describe('suggestUntitledExt', () => {
  const extensions = ['markdown', 'yaml', 'json', 'jsx', 'tsx'] as const;

  it('returns first prefix match', () => {
    expect(suggestUntitledExt('mark', extensions)).toBe('markdown');
    expect(suggestUntitledExt('j', extensions)).toBe('json');
  });

  it('returns null when empty or no match', () => {
    expect(suggestUntitledExt('', extensions)).toBeNull();
    expect(suggestUntitledExt('rs', extensions)).toBeNull();
  });
});

describe('completeUntitledExt', () => {
  const extensions = ['markdown', 'yaml', 'json', 'jsx', 'tsx'] as const;

  it('accepts the current suggestion', () => {
    expect(completeUntitledExt('mark', extensions)).toBe('markdown');
    expect(completeUntitledExt('j', extensions)).toBe('json');
  });

  it('cycles when query already equals a match among several', () => {
    const short = ['ts', 'tsx'] as const;
    expect(completeUntitledExt('ts', short)).toBe('tsx');
    expect(completeUntitledExt('tsx', short)).toBe('tsx');
  });

  it('returns raw when nothing matches', () => {
    expect(completeUntitledExt('rs', extensions)).toBe('rs');
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
