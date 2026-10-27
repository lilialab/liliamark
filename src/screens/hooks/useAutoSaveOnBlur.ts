import { useEffect, useEffectEvent } from 'react';
import { onWindowFocusChanged } from '../../lib/tauri/fs';

/** 窗口失焦时触发保存（编辑器 blur 由 CodeEditor 另行回调） */
export function useAutoSaveOnBlur(saveDirtyTabs: () => void | Promise<void>) {
  const save = useEffectEvent(() => {
    void saveDirtyTabs();
  });

  useEffect(() => {
    const ready = onWindowFocusChanged((focused) => {
      if (!focused) {
        save();
      }
    });

    return () => {
      void ready.then((unlisten) => unlisten());
    };
  }, []);
}
