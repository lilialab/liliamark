import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { DragDropEvent } from '@tauri-apps/api/webview';
import { getCurrentWebview } from '@tauri-apps/api/webview';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { ask, open } from '@tauri-apps/plugin-dialog';
import type { DiskFileChanged } from '../../types/diskFileChanged';
import type { OpenedTextFile } from '../../types/textFile';

export type DropPathsClassification = {
  files: string[];
  hadDirectory: boolean;
};

/** 读取本地文本文件内容 */
export async function readTextFile(path: string): Promise<string> {
  return invoke<string>('read_text_file', { path });
}

/** 将文本写入本地文件 */
export async function writeTextFile(path: string, content: string): Promise<void> {
  await invoke('write_text_file', { path, content });
}

/** 按路径读取文本文件（路径 + 内容） */
export async function openTextPath(path: string): Promise<OpenedTextFile> {
  const content = await readTextFile(path);
  return { path, content };
}

/** 选择本地文件路径；取消选择时返回 null（不按扩展名过滤，不读内容） */
export async function pickTextFile(): Promise<string | null> {
  const selected = await open({
    multiple: false,
    directory: false,
  });

  if (selected === null) {
    return null;
  }

  const path = Array.isArray(selected) ? selected[0] : selected;
  return path ?? null;
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

/** 监听窗口焦点变化；payload 为是否聚焦 */
export function onWindowFocusChanged(
  handler: (focused: boolean) => void,
) {
  return getCurrentWindow().onFocusChanged(({ payload: focused }) => {
    handler(focused);
  });
}

/** 关闭当前窗口（会走 onCloseRequested / 未保存确认） */
export async function closeCurrentWindow(): Promise<void> {
  await getCurrentWindow().close();
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

/** 同步 Rust 侧应监听的已打开文件路径 */
export async function syncWatchedFiles(paths: string[]): Promise<void> {
  await invoke('sync_watched_files', { paths });
}

/** 监听已打开文件的磁盘变更 */
export function onDiskFileChanged(handler: (payload: DiskFileChanged) => void) {
  return listen<DiskFileChanged>('disk-file-changed', (event) => {
    handler(event.payload);
  });
}

/** 监听窗口文件拖放（enter / over / drop / leave） */
export function onDragDrop(handler: (event: DragDropEvent) => void) {
  return getCurrentWebview().onDragDropEvent((event) => {
    handler(event.payload);
  });
}

/** 把拖入路径分成普通文件；若含目录则标记 */
export async function classifyDropPaths(paths: string[]): Promise<DropPathsClassification> {
  return invoke<DropPathsClassification>('classify_drop_paths', { paths });
}
