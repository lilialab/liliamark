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
  /** Shift+Alt+F：整篇格式化（JSON / Markdown） */
  onFormatDocument: () => void | Promise<void>;
};

type HotkeyBinding = {
  /** Ctrl / Cmd */
  mod?: boolean;
  shift?: boolean;
  alt?: boolean;
  code: string;
  run: () => void;
  when?: (event: KeyboardEvent) => boolean;
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

/** 修饰键按「要/不要」全等匹配，避免 Mod+S 吃掉 Mod+Shift+S。 */
function matchesBinding(event: KeyboardEvent, binding: HotkeyBinding): boolean {
  const wantsMod = binding.mod === true;
  const wantsShift = binding.shift === true;
  const wantsAlt = binding.alt === true;
  const hasMod = event.ctrlKey || event.metaKey;

  if (wantsMod !== hasMod || wantsShift !== event.shiftKey || wantsAlt !== event.altKey) {
    return false;
  }
  if (event.code !== binding.code) {
    return false;
  }
  return binding.when?.(event) ?? true;
}

/**
 * 应用级快捷键（window capture）。
 * 绑定表：新建 / 保存 / 另存为 / 预览 / 关标签 / 关窗口 / 全选 / 格式化。
 */
export function useEditorHotkeys({
  onNew,
  onSave,
  onSaveAs,
  onTogglePreview,
  onCloseTab,
  onCloseWindow,
  onSelectAllInEditor,
  onFormatDocument,
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
  const formatDocument = useEffectEvent(() => {
    void onFormatDocument();
  });

  useEffect(() => {
    const bindings: HotkeyBinding[] = [
      { alt: true, shift: true, code: 'KeyF', run: formatDocument },
      { mod: true, shift: true, code: 'KeyS', run: saveAs },
      { mod: true, code: 'KeyN', run: createNew },
      { mod: true, code: 'KeyS', run: save },
      { mod: true, code: 'KeyE', run: togglePreview },
      { mod: true, code: 'KeyW', run: closeTab },
      { mod: true, code: 'KeyQ', run: closeWindow },
      {
        mod: true,
        code: 'KeyA',
        run: selectAllInEditor,
        when: (event) => !shouldKeepNativeSelectAll(event.target),
      },
    ];

    function onKeyDown(event: KeyboardEvent) {
      for (const binding of bindings) {
        if (!matchesBinding(event, binding)) {
          continue;
        }
        event.preventDefault();
        binding.run();
        return;
      }
    }

    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
    };
  }, []);
}
