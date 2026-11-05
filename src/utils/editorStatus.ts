import type { EditorState } from '@codemirror/state';

/** 底栏用的光标 / 文档规模（均来自 CM Text，不拷贝正文） */
export type EditorCaretStatus = {
  line: number;
  col: number;
  chars: number;
  lines: number;
  /** 主选区选中字符数；无选区为 0 */
  selectedChars: number;
};

/** 从 EditorState 读取底栏数字；O(1) 元数据 + 一次 lineAt */
export function readEditorCaretStatus(state: EditorState): EditorCaretStatus {
  const { head, from, to } = state.selection.main;
  const line = state.doc.lineAt(head);
  return {
    line: line.number,
    col: head - line.from + 1,
    chars: state.doc.length,
    lines: state.doc.lines,
    selectedChars: to - from,
  };
}
