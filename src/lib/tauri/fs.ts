import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { ask, open } from '@tauri-apps/plugin-dialog';
import type { OpenedMarkdownFile } from '../../types/markdownFile';

const markdownFilters = [{ name: 'Markdown', extensions: ['md', 'markdown'] }];

/** 读取本地文本文件内容 */
export async function readTextFile(path: string): Promise<string> {
  return invoke<string>('read_text_file', { path });
}

/** 将文本写入本地文件 */
export async function writeTextFile(path: string, content: string): Promise<void> {
  await invoke('write_text_file', { path, content });
}

/** 按路径打开 Markdown 文件 */
export async function openMarkdownPath(path: string): Promise<OpenedMarkdownFile> {
  const content = await readTextFile(path);
  return { path, content };
}

/** 选择并打开本地 Markdown；取消选择时返回 null */
export async function openMarkdownFile(): Promise<OpenedMarkdownFile | null> {
  const selected = await open({
    multiple: false,
    directory: false,
    filters: markdownFilters,
  });

  if (selected === null) {
    return null;
  }

  const path = Array.isArray(selected) ? selected[0] : selected;
  if (!path) {
    return null;
  }

  return openMarkdownPath(path);
}

/** 确认是否丢弃未保存更改 */
export async function confirmDiscardChanges(): Promise<boolean> {
  return await ask('有未保存的更改，确定继续吗？', {
    title: 'LiliaMark',
    kind: 'warning',
  });
}

/** 退出前确认：丢弃全部未保存文件 */
export async function confirmDiscardUnsavedTabs(count: number): Promise<boolean> {
  return await ask(`有 ${count} 个未保存的文件，确定退出吗？`, {
    title: 'LiliaMark',
    kind: 'warning',
  });
}

/** 监听窗口关闭请求；取消时在 handler 内 preventDefault */
export function onWindowCloseRequested(
  handler: (event: { preventDefault: () => void }) => void | Promise<void>,
) {
  return getCurrentWindow().onCloseRequested(handler);
}

/** 取出启动时由系统传入的待打开路径（一次性） */
export async function takePendingOpenPath(): Promise<string | null> {
  return invoke<string | null>('take_pending_open_path');
}

/** 监听运行中由「打开方式」传入的文件路径 */
export function onOpenFilePath(handler: (path: string) => void) {
  return listen<string>('open-file', (event) => {
    handler(event.payload);
  });
}
