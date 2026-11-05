import { invoke } from '@tauri-apps/api/core';
import { decodeTextChanges, encodeFormatRequest } from './ipcBytes';

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
  indentSize: number,
): Promise<FormatDocumentResult> {
  const payload = encodeFormatRequest(languagePath, indentSize, content);
  const buffer = await invoke<ArrayBuffer>('format_document_text', payload);
  return { changes: decodeTextChanges(buffer) };
}
