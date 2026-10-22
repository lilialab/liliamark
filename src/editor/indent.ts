import { indentUnit } from '@codemirror/language';
import { EditorState, type Extension } from '@codemirror/state';
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
