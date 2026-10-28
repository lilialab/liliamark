import { useEffect, useEffectEvent } from 'react';
import { destroyCurrentWindow, onWindowCloseRequested } from '../../lib/tauri/fs';

/** 退出前若有未保存内容，交由调用方决定是否关闭（true 则 destroy） */
export function useUnsavedCloseGuard(
  getDirtyCount: () => number,
  decideClose: (count: number) => Promise<boolean>,
) {
  const readDirtyCount = useEffectEvent(() => getDirtyCount());
  const decide = useEffectEvent((count: number) => decideClose(count));

  useEffect(() => {
    const ready = onWindowCloseRequested(async (event) => {
      const dirtyCount = readDirtyCount();
      if (dirtyCount === 0) {
        return;
      }

      // 自建弹窗异步；先拦住关闭，确认后再 destroy
      event.preventDefault();
      const shouldClose = await decide(dirtyCount);
      if (shouldClose) {
        await destroyCurrentWindow();
      }
    });

    return () => {
      void ready.then((unlisten) => unlisten());
    };
  }, []);
}
