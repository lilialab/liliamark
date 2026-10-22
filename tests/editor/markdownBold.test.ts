import { describe, expect, it } from 'vitest';
import { boldEditForRange } from '../../src/editor/markdownBold';

describe('boldEditForRange', () => {
  it('inserts **** at empty caret', () => {
    expect(boldEditForRange('hello', 2, 2)).toEqual({
      changes: { from: 2, insert: '****' },
      anchor: 4,
      head: 4,
    });
  });

  it('wraps selection with **', () => {
    expect(boldEditForRange('say hi', 4, 6)).toEqual({
      changes: { from: 4, to: 6, insert: '**hi**' },
      anchor: 6,
      head: 8,
    });
  });

  it('unwraps when selection includes **', () => {
    expect(boldEditForRange('**hi**', 0, 6)).toEqual({
      changes: { from: 0, to: 6, insert: 'hi' },
      anchor: 0,
      head: 2,
    });
  });

  it('unwraps when selection is surrounded by **', () => {
    expect(boldEditForRange('**hi**', 2, 4)).toEqual({
      changes: { from: 0, to: 6, insert: 'hi' },
      anchor: 0,
      head: 2,
    });
  });
});
