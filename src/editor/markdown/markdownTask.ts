import type { EditorView, KeyBinding } from '@codemirror/view';

export type TaskToggleEdit = {
  /** 相对行首：`[ ]` / `[X]` 的起止（与 markdown-ppp 输出对齐） */
  from: number;
  to: number;
  insert: string;
};

/** GFM 任务行：`- [ ]` / `1. [X]` 等；返回框内切换编辑，否则 null */
export function taskToggleEditForLine(lineText: string): TaskToggleEdit | null {
  const match = /^(\s*(?:[-*+]|\d+\.)\s+)\[([ xX])\](.*)$/.exec(lineText);
  if (match === null) return null;

  const prefix = match[1];
  const mark = match[2];
  const next = mark === ' ' ? 'X' : ' ';
  return {
    from: prefix.length,
    to: prefix.length + 3,
    insert: `[${next}]`,
  };
}

function toggleTask(view: EditorView): boolean {
  const { state } = view;
  const changes: { from: number; to: number; insert: string }[] = [];
  const seenLineFrom = new Set<number>();

  for (const range of state.selection.ranges) {
    const line = state.doc.lineAt(range.head);
    if (seenLineFrom.has(line.from)) continue;
    seenLineFrom.add(line.from);

    const edit = taskToggleEditForLine(line.text);
    if (edit === null) continue;
    changes.push({
      from: line.from + edit.from,
      to: line.from + edit.to,
      insert: edit.insert,
    });
  }

  if (changes.length === 0) return false;
  view.dispatch({ changes });
  return true;
}

/** Alt-Enter：当前行任务 `[ ]` ↔ `[X]`；非任务行不接管 */
export const markdownTaskKeymap: KeyBinding[] = [
  { key: 'Alt-Enter', run: toggleTask },
];
