import { useEffect, useEffectEvent } from 'react';
import { onOpenFilePath, takePendingOpenPath } from '../../lib/tauri/fs';

/**
 * 冷启动 pending 与运行中「打开方式」。
 * 须在会话恢复完成（sessionReady）后再跑，避免与恢复的 tabs 重复开页。
 */
export function useExternalOpenFile(
  loadFile: (path: string) => Promise<void>,
  sessionReady: boolean,
) {
  const openPath = useEffectEvent(async (filePath: string) => {
    await loadFile(filePath);
  });

  useEffect(() => {
    if (!sessionReady) {
      return;
    }

    let cancelled = false;

    async function startListening() {
      const unlisten = await onOpenFilePath((filePath) => {
        if (!cancelled) {
          void openPath(filePath);
        }
      });

      const pending = await takePendingOpenPath();
      if (pending && !cancelled) {
        await openPath(pending);
      }

      return unlisten;
    }

    const ready = startListening();

    return () => {
      cancelled = true;
      void ready.then((unlisten) => unlisten());
    };
  }, [sessionReady]);
}
