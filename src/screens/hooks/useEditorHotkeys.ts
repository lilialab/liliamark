import { useEffect, useEffectEvent } from 'react';

type EditorHotkeys = {
  onSave: () => void | Promise<void>;
  onTogglePreview: () => void;
};

/** Ctrl/Cmd+S 保存；Ctrl/Cmd+E 切换预览 */
export function useEditorHotkeys({ onSave, onTogglePreview }: EditorHotkeys) {
  const save = useEffectEvent(() => {
    void onSave();
  });
  const togglePreview = useEffectEvent(() => {
    onTogglePreview();
  });

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey)) {
        return;
      }

      const key = event.key.toLowerCase();
      if (key === 's') {
        event.preventDefault();
        save();
        return;
      }
      if (key === 'e') {
        event.preventDefault();
        togglePreview();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);
}
