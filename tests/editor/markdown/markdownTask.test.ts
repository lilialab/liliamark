import { describe, expect, it } from 'vitest';
import { taskToggleEditForLine } from '../../../src/editor/markdown/markdownTask';

describe('taskToggleEditForLine', () => {
  it('toggles unchecked to checked', () => {
    expect(taskToggleEditForLine('- [ ] buy milk')).toEqual({
      from: 2,
      to: 5,
      insert: '[X]',
    });
  });

  it('toggles checked to unchecked', () => {
    expect(taskToggleEditForLine('- [X] buy milk')).toEqual({
      from: 2,
      to: 5,
      insert: '[ ]',
    });
    expect(taskToggleEditForLine('- [x] buy milk')?.insert).toBe('[ ]');
  });

  it('supports *, + and ordered list markers', () => {
    expect(taskToggleEditForLine('  * [ ] a')?.insert).toBe('[X]');
    expect(taskToggleEditForLine('+ [X] b')?.insert).toBe('[ ]');
    expect(taskToggleEditForLine('12. [ ] c')).toEqual({
      from: 4,
      to: 7,
      insert: '[X]',
    });
  });

  it('returns null for non-task lines', () => {
    expect(taskToggleEditForLine('- not a task')).toBeNull();
    expect(taskToggleEditForLine('plain text')).toBeNull();
    expect(taskToggleEditForLine('- [] missing space')).toBeNull();
  });
});
