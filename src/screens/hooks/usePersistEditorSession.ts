import { useEffect, useRef } from 'react';
import { saveEditorSession } from '../../lib/tauri/session';
import type { EditorTab } from '../../types/editorTab';

/** 标签增删或切换激活时写入会话；跳过首次挂载以免冲掉待恢复数据 */
export function usePersistEditorSession(tabs: EditorTab[], activeId: string | null) {
  const skipFirst = useRef(true);
  const pathsKey = tabs.map((tab) => tab.path).join('\0');
  const activePath = tabs.find((tab) => tab.id === activeId)?.path ?? null;

  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }

    const paths = pathsKey.length === 0 ? [] : pathsKey.split('\0');
    void saveEditorSession({ paths, activePath }).catch(() => {
      // Browser / non-tauri preview has no session command.
    });
  }, [pathsKey, activePath]);
}
