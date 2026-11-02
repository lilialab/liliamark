import type { EditorView } from '@codemirror/view';
import { formatDocumentText } from '../lib/tauri/format';
import type { IndentStyle } from '../types/appSettings';
import { fileExtension } from '../utils/path';

export type FormatKind = 'json' | 'markdown';

export type FormatDocumentResult = 'formatted' | 'unchanged' | 'unsupported';

type FormatDocumentOptions = {
  languagePath: string;
  indentStyle: IndentStyle;
  indentSize: number;
};

/** 当前路径是否支持整篇格式化（与 Rust `format_kind_for_path` 对齐） */
export function formatKindForPath(path: string): FormatKind | null {
  const ext = fileExtension(path);
  if (ext === 'json' || ext === 'jsonc') {
    return 'json';
  }
  if (ext === 'md' || ext === 'markdown') {
    return 'markdown';
  }
  return null;
}

/** 是否支持整篇格式化（JSON / Markdown，经 Rust） */
export function supportsDocumentFormat(path: string): boolean {
  return formatKindForPath(path) !== null;
}

/**
 * 经 Tauri 在 Rust 侧格式化 + diff，再单次 dispatch 写回 CM。
 * 忙碌态由上层蒙版负责，此处不改 editable。
 */
export async function formatEditorDocument(
  view: EditorView,
  options: FormatDocumentOptions,
): Promise<FormatDocumentResult> {
  if (!formatKindForPath(options.languagePath)) {
    return 'unsupported';
  }

  const before = view.state.doc.toString();
  const { changes } = await formatDocumentText(options.languagePath, before, {
    indentStyle: options.indentStyle,
    indentSize: options.indentSize,
  });

  if (view.state.doc.toString() !== before) {
    return 'unchanged';
  }

  if (changes.length === 0) {
    return 'unchanged';
  }

  view.dispatch({ changes });
  return 'formatted';
}
