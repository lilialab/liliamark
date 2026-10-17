import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import type { OpenedMarkdownFile } from '../../types/markdownFile';

/** 读取本地文本文件内容 */
export async function readTextFile(path: string): Promise<string> {
  return invoke<string>('read_text_file', { path });
}

/** 选择并打开本地 Markdown；取消选择时返回 null */
export async function openMarkdownFile(): Promise<OpenedMarkdownFile | null> {
  const selected = await open({
    multiple: false,
    directory: false,
    filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }],
  });

  if (selected === null) {
    return null;
  }

  const path = Array.isArray(selected) ? selected[0] : selected;
  if (!path) {
    return null;
  }

  const content = await readTextFile(path);
  return { path, content };
}
