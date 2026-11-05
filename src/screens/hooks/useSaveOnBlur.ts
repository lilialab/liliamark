import { useEffect, useEffectEvent } from 'react';
import { onWindowFocusChanged } from '../../lib/tauri/fs';

/** 窗口失焦时执行保存（具体策略由调用方决定） */
export function useSaveOnBlur(onBlur: () => void | Promise<void>) {
  const handleBlur = useEffectEvent(() => onBlur());

  useEffect(() => {
    const ready = onWindowFocusChanged((focused) => {
      if (!focused) {
        void handleBlur();
      }
    });

    return () => {
      void ready.then((unlisten) => unlisten());
    };
  }, []);
}
