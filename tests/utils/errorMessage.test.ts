import { describe, expect, it } from 'vitest';
import { errorMessage } from '../../src/utils/errorMessage';

describe('errorMessage', () => {
  it('reads Error.message', () => {
    expect(errorMessage(new Error('boom'))).toBe('boom');
  });

  it('stringifies non-Error values', () => {
    expect(errorMessage('plain')).toBe('plain');
    expect(errorMessage(42)).toBe('42');
  });
});
