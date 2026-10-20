import { useEffect, useEffectEvent } from 'react';
import { onOpenFilePath, takePendingOpenPath } from '../../lib/tauri/fs';

/** 冷启动待打开路径 + 运行中「打开方式」 */
export function useExternalOpenFile(loadFile: (path: string) => Promise<void>) {
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
      const unlisten = await onOpenFilePath((filePath) => {
        void openExternalPath(filePath);
      });

      try {
        const pending = await takePendingOpenPath();
        if (pending && !cancelled) {
          await openExternalPath(pending);
        }
      } catch {
        // Browser / non-tauri preview has no launch path command.
      }

      return unlisten;
    })();

    return () => {
      cancelled = true;
      void ready.then((unlisten) => unlisten());
    };
  }, []);
}
