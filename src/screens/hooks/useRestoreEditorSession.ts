import { useEffect, useEffectEvent, useState } from 'react';
import { loadEditorSession } from '../../lib/tauri/storage';
import type { EditorTab } from '../../types/editorTab';
import { createTabId } from '../../utils/editorTab';
import { reportStartupTiming, startupMark } from '../../utils/startupTiming';

type ApplyRestoredTabs = (tabs: EditorTab[], activePath: string | null) => void;

/** 启动时恢复编辑器会话；返回是否已完成（成功或跳过） */
export function useRestoreEditorSession(applyRestoredTabs: ApplyRestoredTabs): boolean {
  const [sessionReady, setSessionReady] = useState(false);
  const applyRestored = useEffectEvent(applyRestoredTabs);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const session = await loadEditorSession();
      if (cancelled) {
        return;
      }

      const restored: EditorTab[] = session.paths.map((path) => ({
        id: createTabId(),
        path,
        dirty: false,
        diskChange: null,
        docEpoch: 0,
      }));
      applyRestored(restored, session.activePath);
      setSessionReady(true);
      startupMark('session-done');
      void reportStartupTiming();
    }

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  return sessionReady;
}
