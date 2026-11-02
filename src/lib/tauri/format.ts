import { invoke } from '@tauri-apps/api/core';
import { decodeTextChanges, encodeFormatRequest } from './ipcBytes';

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

/** 整份正文在 Rust 侧格式化并 diff（Raw 字节 IPC） */
export async function formatDocumentText(
  languagePath: string,
  content: string,
  options: FormatIndentOptions,
): Promise<FormatDocumentResult> {
  const payload = encodeFormatRequest(
    languagePath,
    options.indentStyle,
    options.indentSize,
    content,
  );
  const buffer = await invoke<ArrayBuffer>('format_document_text', payload);
  return { changes: decodeTextChanges(buffer) };
}
