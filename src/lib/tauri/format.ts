import { invoke } from '@tauri-apps/api/core';

export type FormatIndentOptions = {
  indentStyle: string;
  indentSize: number;
};

export type FormatTextChange = {
  from: number;
  to: number;
  insert: string;
};

export type FormatDocumentResult = {
  changes: FormatTextChange[];
};

/** 整份正文在 Rust 侧格式化并 diff */
export async function formatDocumentText(
  languagePath: string,
  content: string,
  options: FormatIndentOptions,
): Promise<FormatDocumentResult> {
  return invoke<FormatDocumentResult>('format_document_text', {
    languagePath,
    content,
    options,
  });
}
