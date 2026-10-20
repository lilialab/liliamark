import { useEffect, useEffectEvent } from 'react';

/** Ctrl/Cmd+S 保存 */
export function useEditorHotkeys(onSave: () => void | Promise<void>) {
  const save = useEffectEvent(() => {
    void onSave();
  });

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 's') {
        return;
      }
      event.preventDefault();
      save();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);
}
