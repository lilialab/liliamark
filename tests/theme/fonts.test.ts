import { describe, expect, it } from 'vitest';
import { resolvedFontVar } from '../../src/theme/fonts';

describe('resolvedFontVar', () => {
  it('returns trimmed stack when non-empty', () => {
    expect(resolvedFontVar('  Georgia, serif  ')).toBe('Georgia, serif');
  });

  it('returns null when blank so caller can removeProperty', () => {
    expect(resolvedFontVar('')).toBeNull();
    expect(resolvedFontVar('   ')).toBeNull();
  });
});
