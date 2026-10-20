import type { EditorSession } from '../types/editorSession';
import { sameFilePath } from './path';

type TabPath = {
  id: string;
  path: string;
};

/** 从当前标签生成可持久化的会话（仅路径） */
export function editorSessionFromTabs(
  tabs: TabPath[],
  activeId: string | null,
): EditorSession {
  return {
    paths: tabs.map((tab) => tab.path),
    activePath: tabs.find((tab) => tab.id === activeId)?.path ?? null,
  };
}

/** 恢复后选定激活标签：优先会话路径，否则第一个 */
export function resolveActiveTabId(
  tabs: TabPath[],
  activePath: string | null,
): string | null {
  if (activePath !== null) {
    const match = tabs.find((tab) => sameFilePath(tab.path, activePath));
    if (match) {
      return match.id;
    }
  }

  return tabs[0]?.id ?? null;
}
