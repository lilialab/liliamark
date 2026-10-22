import { indentLess, indentMore } from '@codemirror/commands';
import { indentUnit } from '@codemirror/language';
import { EditorState, type Extension } from '@codemirror/state';
import type { KeyBinding } from '@codemirror/view';
import type { IndentStyle } from '../types/appSettings';

/** 非法值回落 space */
export function parseIndentStyle(value: string): IndentStyle {
  return value === 'tab' ? 'tab' : 'space';
}

/** 非法或过小回落 defaultSize */
export function parseIndentSize(value: number, defaultSize: number): number {
  return Number.isInteger(value) && value >= 1 ? value : defaultSize;
}

/** CodeMirror：tabSize + indentUnit */
export function indentExtensions(style: IndentStyle, size: number): Extension {
  const unit = style === 'tab' ? '\t' : ' '.repeat(size);
  return [EditorState.tabSize.of(size), indentUnit.of(unit)];
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
