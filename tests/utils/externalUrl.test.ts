import { describe, expect, it } from 'vitest';
import { isHttpUrl, normalizeHttpUrl } from '../../src/utils/externalUrl';

describe('isHttpUrl', () => {
  it('accepts http(s)', () => {
    expect(isHttpUrl('https://example.com/a')).toBe(true);
    expect(isHttpUrl('http://localhost:1420')).toBe(true);
  });

  it('rejects other schemes and junk', () => {
    expect(isHttpUrl('javascript:alert(1)')).toBe(false);
    expect(isHttpUrl('mailto:a@b.c')).toBe(false);
    expect(isHttpUrl('not a url')).toBe(false);
  });
});

describe('normalizeHttpUrl', () => {
  it('strips autolink brackets', () => {
    expect(normalizeHttpUrl('<https://example.com>')).toBe('https://example.com/');
  });

  it('returns null when not http(s)', () => {
    expect(normalizeHttpUrl('ftp://example.com')).toBeNull();
  });
});
