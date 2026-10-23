import type { DiskChangeKind } from '../types/diskFileChanged';
import type { EditorTab } from '../types/editorTab';
import { sameFilePath } from './path';

/** 新建 tab 的唯一 id */
export function createTabId(): string {
  return crypto.randomUUID();
}

/** 按 id 更新单个 tab */
export function updateTab(
  tabs: EditorTab[],
  id: string,
  update: (tab: EditorTab) => EditorTab,
): EditorTab[] {
  return tabs.map((tab) => (tab.id === id ? update(tab) : tab));
}

/** 标记为已保存（清脏） */
export function withSaved(tab: EditorTab): EditorTab {
  return { ...tab, dirty: false };
}

/** 触发 CM 重挂并清脏 / 磁盘标记；正文由挂载后读盘灌入 */
export function withDiskReload(tab: EditorTab): EditorTab {
  return {
    ...tab,
    dirty: false,
    diskChange: null,
    docEpoch: tab.docEpoch + 1,
  };
}

/** 清除磁盘变更标记，保留正文 */
export function withoutDiskChange(tab: EditorTab): EditorTab {
  return { ...tab, diskChange: null };
}

/** 给匹配路径的 tab 打上磁盘变更 */
export function withDiskChange(
  tabs: EditorTab[],
  path: string,
  kind: DiskChangeKind,
): EditorTab[] {
  return tabs.map((tab) => (sameFilePath(tab.path, path) ? { ...tab, diskChange: kind } : tab));
}
