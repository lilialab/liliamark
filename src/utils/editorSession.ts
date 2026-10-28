import type { EditorSession } from '../types/editorSession';
import { sameFilePath } from './path';

type TabPath = {
  id: string;
  path: string | null;
};

/** 从当前标签生成可持久化的会话（仅已落盘路径） */
export function editorSessionFromTabs(
  tabs: TabPath[],
  activeId: string | null,
): EditorSession {
  const paths = tabs
    .map((tab) => tab.path)
    .filter((path): path is string => path !== null);
  const active = tabs.find((tab) => tab.id === activeId);
  return {
    paths,
    activePath: active?.path ?? null,
  };
}

/** 恢复后选定激活标签：优先会话路径，否则第一个 */
export function resolveActiveTabId(
  tabs: TabPath[],
  activePath: string | null,
): string | null {
  if (activePath !== null) {
    const match = tabs.find(
      (tab) => tab.path !== null && sameFilePath(tab.path, activePath),
    );
    if (match) {
      return match.id;
    }
  }

  return tabs[0]?.id ?? null;
}
