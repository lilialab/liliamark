import { indentLess, indentMore } from '@codemirror/commands';
import { indentUnit } from '@codemirror/language';
import { EditorState, type Extension } from '@codemirror/state';
import type { KeyBinding } from '@codemirror/view';

/** CodeMirror：tabSize + 空格 indentUnit（size 由设置保证为 2 / 4） */
export function indentExtensions(size: number): Extension {
  return [EditorState.tabSize.of(size), indentUnit.of(' '.repeat(size))];
}

/**
 * Tab：无选区在光标插入 indentUnit；有选区整行缩进。
 * Shift+Tab：减少缩进。
 */
export const indentKeymap: KeyBinding[] = [
  {
    key: 'Tab',
    run: (view) => {
      const { state } = view;
      if (state.selection.ranges.some((range) => !range.empty)) {
        return indentMore(view);
      }
      view.dispatch(state.replaceSelection(state.facet(indentUnit)));
      return true;
    },
  },
  { key: 'Shift-Tab', run: indentLess },
];
