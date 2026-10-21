import { describe, expect, it } from 'vitest';
import {
  MAX_FONT_SIZE,
  MIN_FONT_SIZE,
  parseFontSizeInput,
  resolvedFontVar,
} from '../../src/theme/fonts';

describe('resolvedFontVar', () => {
  it('returns trimmed stack when non-empty', () => {
    expect(resolvedFontVar('  Georgia, serif  ')).toBe('Georgia, serif');
  });

  it('returns null when blank so caller can removeProperty', () => {
    expect(resolvedFontVar('')).toBeNull();
    expect(resolvedFontVar('   ')).toBeNull();
  });
});

describe('parseFontSizeInput', () => {
  it('accepts integers in 8–72', () => {
    expect(parseFontSizeInput(String(MIN_FONT_SIZE))).toBe(MIN_FONT_SIZE);
    expect(parseFontSizeInput('16')).toBe(16);
    expect(parseFontSizeInput(' 24 ')).toBe(24);
    expect(parseFontSizeInput(String(MAX_FONT_SIZE))).toBe(MAX_FONT_SIZE);
  });

  it('rejects empty, non-integer, and out of range', () => {
    expect(parseFontSizeInput('')).toBeNull();
    expect(parseFontSizeInput('   ')).toBeNull();
    expect(parseFontSizeInput('16.5')).toBeNull();
    expect(parseFontSizeInput('abc')).toBeNull();
    expect(parseFontSizeInput('0')).toBeNull();
    expect(parseFontSizeInput('-8')).toBeNull();
    expect(parseFontSizeInput(String(MIN_FONT_SIZE - 1))).toBeNull();
    expect(parseFontSizeInput(String(MAX_FONT_SIZE + 1))).toBeNull();
  });
});
