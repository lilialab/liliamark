import { useEffect, useEffectEvent } from 'react';
import { onOpenFilePath, openMarkdownPath, takePendingOpenPath } from '../../lib/tauri/fs';
import { loadEditorSession } from '../../lib/tauri/session';
import type { EditorTab } from '../../types/editorTab';
import { createTabId } from '../../utils/editorTab';
import { reportStartupTiming, startupMark } from '../../utils/startupTiming';

type ApplyRestoredTabs = (tabs: EditorTab[], activePath: string | null) => void;

/** 启动：先恢复会话，再处理冷启动 / 运行中「打开方式」 */
export function useExternalOpenFile(
  applyRestoredTabs: ApplyRestoredTabs,
  loadFile: (path: string) => Promise<void>,
) {
  const applyRestored = useEffectEvent(applyRestoredTabs);
  const openPath = useEffectEvent(async (filePath: string) => {
    await loadFile(filePath);
  });

  useEffect(() => {
    let cancelled = false;
    let lastPath: string | null = null;
    let lastAt = 0;

    async function openExternalPath(filePath: string) {
      const now = Date.now();
      if (lastPath === filePath && now - lastAt < 500) {
        return;
      }
      lastPath = filePath;
      lastAt = now;
      if (!cancelled) {
        await openPath(filePath);
      }
    }

    const ready = (async () => {
      let unlisten: (() => void) | undefined;
      try {
        unlisten = await onOpenFilePath((filePath) => {
          void openExternalPath(filePath);
        });
      } catch {
        // Browser / non-tauri preview has no open-file event.
        startupMark('session-start');
        startupMark('session-done');
        reportStartupTiming();
        return undefined;
      }

      try {
        startupMark('session-start');
        const session = await loadEditorSession();
        if (cancelled) {
          return unlisten;
        }

        const restored: EditorTab[] = [];
        for (const path of session.paths) {
          try {
            const file = await openMarkdownPath(path);
            restored.push({
              id: createTabId(),
              path: file.path,
              source: file.content,
              savedSource: file.content,
              diskChange: null,
              docEpoch: 0,
            });
          } catch {
            // 打不开的路径跳过
          }
        }

        if (!cancelled) {
          applyRestored(restored, session.activePath);
        }

        const pending = await takePendingOpenPath();
        if (pending && !cancelled) {
          await openExternalPath(pending);
        }
      } catch {
        // Browser / non-tauri preview has no session / launch commands.
      } finally {
        if (!cancelled) {
          startupMark('session-done');
          reportStartupTiming();
        }
      }

      return unlisten;
    })();

    return () => {
      cancelled = true;
      void ready.then((unlisten) => unlisten?.());
    };
  }, []);
}
