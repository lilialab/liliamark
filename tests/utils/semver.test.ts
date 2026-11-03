import { describe, expect, it } from 'vitest';
import { isNewerSemver, parseSemver } from '../../src/utils/semver';

describe('parseSemver', () => {
  it('parses plain and v-prefixed versions', () => {
    expect(parseSemver('0.2.1')).toEqual([0, 2, 1]);
    expect(parseSemver('v1.0.0')).toEqual([1, 0, 0]);
    expect(parseSemver('V2.3.4-extra')).toEqual([2, 3, 4]);
  });

  it('returns null for invalid input', () => {
    expect(parseSemver('')).toBeNull();
    expect(parseSemver('latest')).toBeNull();
    expect(parseSemver('1.0')).toBeNull();
  });
});

describe('isNewerSemver', () => {
  it('compares major.minor.patch', () => {
    expect(isNewerSemver('0.2.2', '0.2.1')).toBe(true);
    expect(isNewerSemver('v0.3.0', '0.2.9')).toBe(true);
    expect(isNewerSemver('0.2.1', '0.2.1')).toBe(false);
    expect(isNewerSemver('0.2.0', '0.2.1')).toBe(false);
  });

  it('returns false when either side is unparsable', () => {
    expect(isNewerSemver('nope', '0.2.1')).toBe(false);
    expect(isNewerSemver('0.2.2', 'nope')).toBe(false);
  });
});
