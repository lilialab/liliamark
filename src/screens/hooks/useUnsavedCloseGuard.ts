import { useEffect, useEffectEvent } from 'react';
import { confirmDiscardUnsavedTabs, onWindowCloseRequested } from '../../lib/tauri/fs';

/** 退出前若有未保存内容，弹一次确认；脏数量由调用方计算 */
export function useUnsavedCloseGuard(getDirtyCount: () => number) {
  const readDirtyCount = useEffectEvent(() => getDirtyCount());

  useEffect(() => {
    const ready = (async () => {
      try {
        return await onWindowCloseRequested(async (event) => {
          const dirtyCount = readDirtyCount();
          if (dirtyCount === 0) {
            return;
          }

          const discard = await confirmDiscardUnsavedTabs(dirtyCount);
          if (!discard) {
            event.preventDefault();
          }
        });
      } catch {
        // Browser / non-tauri preview has no window close hook.
        return undefined;
      }
    })();

    return () => {
      void ready.then((unlisten) => unlisten?.());
    };
  }, []);
}
