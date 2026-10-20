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

/** 把当前正文记为已保存 */
export function withSavedSource(tab: EditorTab): EditorTab {
  return { ...tab, savedSource: tab.source };
}

/** 用磁盘内容覆盖正文并清掉磁盘变更标记 */
export function withDiskContent(tab: EditorTab, content: string): EditorTab {
  return {
    ...tab,
    source: content,
    savedSource: content,
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
