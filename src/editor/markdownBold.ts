import { EditorSelection } from '@codemirror/state';
import type { EditorView, KeyBinding } from '@codemirror/view';

const MARK = '**';

export type BoldRangeEdit = {
  changes: { from: number; to?: number; insert: string };
  /** 仅本 range 变更后的选区（供 changeByRange） */
  anchor: number;
  head: number;
};

/** 计算单段选区的加粗 / 取消加粗编辑 */
export function boldEditForRange(doc: string, from: number, to: number): BoldRangeEdit {
  if (from === to) {
    return {
      changes: { from, insert: '****' },
      anchor: from + MARK.length,
      head: from + MARK.length,
    };
  }

  const selected = doc.slice(from, to);
  if (selected.startsWith(MARK) && selected.endsWith(MARK) && selected.length >= MARK.length * 2) {
    const inner = selected.slice(MARK.length, selected.length - MARK.length);
    return {
      changes: { from, to, insert: inner },
      anchor: from,
      head: from + inner.length,
    };
  }

  const before = doc.slice(Math.max(0, from - MARK.length), from);
  const after = doc.slice(to, Math.min(doc.length, to + MARK.length));
  if (before === MARK && after === MARK) {
    return {
      changes: { from: from - MARK.length, to: to + MARK.length, insert: selected },
      anchor: from - MARK.length,
      head: from - MARK.length + selected.length,
    };
  }

  return {
    changes: { from, to, insert: `${MARK}${selected}${MARK}` },
    anchor: from + MARK.length,
    head: to + MARK.length,
  };
}

function toggleBold(view: EditorView): boolean {
  const { state } = view;
  const doc = state.doc.toString();
  view.dispatch(
    state.changeByRange((range) => {
      const edit = boldEditForRange(doc, range.from, range.to);
      return {
        changes: edit.changes,
        range: EditorSelection.range(edit.anchor, edit.head),
      };
    }),
  );
  return true;
}

/** Mod-b：选区包/解 `**`；无选区插入 `****` 并置于中间 */
export const markdownBoldKeymap: KeyBinding[] = [{ key: 'Mod-b', run: toggleBold }];
