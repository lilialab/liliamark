import { describe, expect, it } from 'vitest';
import { taskToggleEditForLine } from '../../src/editor/markdownTask';

describe('taskToggleEditForLine', () => {
  it('toggles unchecked to checked', () => {
    expect(taskToggleEditForLine('- [ ] buy milk')).toEqual({
      from: 2,
      to: 5,
      insert: '[x]',
    });
  });

  it('toggles checked to unchecked', () => {
    expect(taskToggleEditForLine('- [x] buy milk')).toEqual({
      from: 2,
      to: 5,
      insert: '[ ]',
    });
    expect(taskToggleEditForLine('- [X] buy milk')?.insert).toBe('[ ]');
  });

  it('supports *, + and ordered list markers', () => {
    expect(taskToggleEditForLine('  * [ ] a')?.insert).toBe('[x]');
    expect(taskToggleEditForLine('+ [x] b')?.insert).toBe('[ ]');
    expect(taskToggleEditForLine('12. [ ] c')).toEqual({
      from: 4,
      to: 7,
      insert: '[x]',
    });
  });

  it('returns null for non-task lines', () => {
    expect(taskToggleEditForLine('- not a task')).toBeNull();
    expect(taskToggleEditForLine('plain text')).toBeNull();
    expect(taskToggleEditForLine('- [] missing space')).toBeNull();
  });
});
