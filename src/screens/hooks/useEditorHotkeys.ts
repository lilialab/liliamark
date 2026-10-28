import { useEffect, useEffectEvent } from 'react';

type EditorHotkeys = {
  onNew: () => void;
  onSave: () => void | Promise<void>;
  onSaveAs: () => void | Promise<void>;
  onTogglePreview: () => void;
  onCloseTab: () => void | Promise<void>;
  onCloseWindow: () => void | Promise<void>;
  /** 焦点不在编辑器 / 表单控件时：聚焦当前编辑器并全选 */
  onSelectAllInEditor: () => void;
};

function shouldKeepNativeSelectAll(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false;
  }
  if (target.closest('.cm-editor')) {
    return true;
  }
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    return true;
  }
  if (target instanceof HTMLElement && target.isContentEditable) {
    return true;
  }
  return false;
}

/** Ctrl/Cmd+N 新建；S 保存；Shift+S 另存为；E 预览；W 关标签；Q 关窗口；A 在编辑区外时回编辑器全选 */
export function useEditorHotkeys({
  onNew,
  onSave,
  onSaveAs,
  onTogglePreview,
  onCloseTab,
  onCloseWindow,
  onSelectAllInEditor,
}: EditorHotkeys) {
  const createNew = useEffectEvent(() => {
    onNew();
  });
  const save = useEffectEvent(() => {
    void onSave();
  });
  const saveAs = useEffectEvent(() => {
    void onSaveAs();
  });
  const togglePreview = useEffectEvent(() => {
    onTogglePreview();
  });
  const closeTab = useEffectEvent(() => {
    void onCloseTab();
  });
  const closeWindow = useEffectEvent(() => {
    void onCloseWindow();
  });
  const selectAllInEditor = useEffectEvent(() => {
    onSelectAllInEditor();
  });

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey)) {
        return;
      }

      const key = event.key.toLowerCase();
      const code = event.code;

      if (key === 'n' || code === 'KeyN') {
        event.preventDefault();
        createNew();
        return;
      }
      if ((key === 's' || code === 'KeyS') && event.shiftKey) {
        event.preventDefault();
        saveAs();
        return;
      }
      if (key === 's' || code === 'KeyS') {
        event.preventDefault();
        save();
        return;
      }
      if (key === 'e' || code === 'KeyE') {
        event.preventDefault();
        togglePreview();
        return;
      }
      if (key === 'w' || code === 'KeyW') {
        event.preventDefault();
        closeTab();
        return;
      }
      if (key === 'q' || code === 'KeyQ') {
        event.preventDefault();
        closeWindow();
        return;
      }
      if (key === 'a' || code === 'KeyA') {
        if (shouldKeepNativeSelectAll(event.target)) {
          return;
        }
        event.preventDefault();
        selectAllInEditor();
      }
    }

    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
    };
  }, []);
}
