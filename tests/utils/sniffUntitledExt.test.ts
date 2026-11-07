import { describe, expect, it } from 'vitest';
import { sniffUntitledExt } from '../../src/utils/sniffUntitledExt';

describe('sniffUntitledExt', () => {
  it('returns null for empty or markdown-like text', () => {
    expect(sniffUntitledExt('')).toBeNull();
    expect(sniffUntitledExt('   ')).toBeNull();
    expect(sniffUntitledExt('# Title\n\nHello')).toBeNull();
    expect(sniffUntitledExt('plain text')).toBeNull();
  });

  it('detects JSON objects and arrays', () => {
    expect(sniffUntitledExt('{"a":1}')).toBe('json');
    expect(sniffUntitledExt('[\n  1,\n  2\n]')).toBe('json');
    expect(sniffUntitledExt('\uFEFF{"a":1}')).toBe('json');
  });

  it('ignores JSON primitives', () => {
    expect(sniffUntitledExt('"hello"')).toBeNull();
    expect(sniffUntitledExt('42')).toBeNull();
    expect(sniffUntitledExt('true')).toBeNull();
    expect(sniffUntitledExt('null')).toBeNull();
  });

  it('detects HTML documents', () => {
    expect(sniffUntitledExt('<!DOCTYPE html><html></html>')).toBe('html');
    expect(sniffUntitledExt('<html lang="en"></html>')).toBe('html');
    expect(sniffUntitledExt('<head><title>x</title></head>')).toBe('html');
    expect(sniffUntitledExt('<body><p>x</p></body>')).toBe('html');
  });

  it('does not treat arbitrary tags as HTML', () => {
    expect(sniffUntitledExt('<div>hi</div>')).toBeNull();
  });

  it('detects XML declarations', () => {
    expect(sniffUntitledExt('<?xml version="1.0"?><root/>')).toBe('xml');
  });

  it('returns null for invalid JSON looking like braces', () => {
    expect(sniffUntitledExt('{not json')).toBeNull();
  });
});
