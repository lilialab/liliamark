import { useEffect, useEffectEvent } from 'react';

type EditorHotkeys = {
  onSave: () => void | Promise<void>;
  onTogglePreview: () => void;
  onCloseTab: () => void | Promise<void>;
};

/** Ctrl/Cmd+S 保存；Ctrl/Cmd+E 切换预览；Ctrl/Cmd+W 关闭当前标签；屏蔽刷新 */
export function useEditorHotkeys({
  onSave,
  onTogglePreview,
  onCloseTab,
}: EditorHotkeys) {
  const save = useEffectEvent(() => {
    void onSave();
  });
  const togglePreview = useEffectEvent(() => {
    onTogglePreview();
  });
  const closeTab = useEffectEvent(() => {
    void onCloseTab();
  });

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'F5') {
        event.preventDefault();
        return;
      }

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
        return;
      }
      if (key === 'w') {
        event.preventDefault();
        closeTab();
        return;
      }
      if (key === 'r') {
        event.preventDefault();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);
}
