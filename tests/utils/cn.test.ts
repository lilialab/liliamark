import { describe, expect, it } from 'vitest';
import { cn } from '../../src/utils/cn';

describe('cn', () => {
  it('merges conflicting Tailwind classes', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('drops falsy values', () => {
    const hidden = false;
    expect(cn('block', hidden && 'hidden', undefined, 'text-sm')).toBe('block text-sm');
  });
});
