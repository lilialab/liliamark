import { EditorState } from '@codemirror/state';
import { describe, expect, it } from 'vitest';
import { readEditorCaretStatus } from '../../src/utils/editorStatus';

describe('readEditorCaretStatus', () => {
  it('reads length, lines, and 1-based caret from an empty doc', () => {
    const state = EditorState.create({ doc: '' });
    expect(readEditorCaretStatus(state)).toEqual({
      line: 1,
      col: 1,
      chars: 0,
      lines: 1,
      selectedChars: 0,
    });
  });

  it('reports caret on a later line and selection size', () => {
    const state = EditorState.create({
      doc: 'ab\ncde',
      selection: { anchor: 2, head: 6 },
    });
    expect(readEditorCaretStatus(state)).toEqual({
      line: 2,
      col: 4,
      chars: 6,
      lines: 2,
      selectedChars: 4,
    });
  });
});
