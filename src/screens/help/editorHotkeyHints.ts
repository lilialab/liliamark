/**
 * 快捷键说明结构（只读）。
 * 应用级对齐 `useEditorHotkeys` / `markdownBoldKeymap` / `indentKeymap`；
 * 编辑器级摘自 CodeMirror `defaultKeymap` / `historyKeymap`（非整表）。
 * 文案键在 i18n `hotkeys.*`。
 */

import type { TFunction } from 'i18next';

export type EditorHotkeyHint = {
  keys: string;
  description: string;
};

export type EditorHotkeyHintSection = {
  title: string;
  hints: EditorHotkeyHint[];
};

function isApplePlatform(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }
  return /Mac|iPhone|iPod|iPad/i.test(navigator.platform ?? '');
}

/** 当前环境用于展示的修饰键标签（macOS / iOS 为 ⌘，其余为 Ctrl）。 */
export function modifierKeyLabel(): string {
  return isApplePlatform() ? '⌘' : 'Ctrl';
}

/** 按平台分组的快捷键说明。 */
export function editorHotkeyHintSections(
  t: TFunction,
  mod: string = modifierKeyLabel(),
): EditorHotkeyHintSection[] {
  const apple = isApplePlatform();
  const wordMod = apple ? '⌥' : mod;
  const redoKeys = apple ? `${mod}+Shift+Z` : `${mod}+Y`;

  return [
    {
      title: t('hotkeys.sectionApp'),
      hints: [
        { keys: `${mod}+S`, description: t('hotkeys.save') },
        { keys: `${mod}+E`, description: t('hotkeys.preview') },
        { keys: `${mod}+W`, description: t('hotkeys.closeTab') },
        { keys: `${mod}+Q`, description: t('hotkeys.closeWindow') },
      ],
    },
    {
      title: t('hotkeys.sectionEdit'),
      hints: [
        { keys: `${mod}+B`, description: t('hotkeys.bold') },
        { keys: 'Tab', description: t('hotkeys.tab') },
        { keys: 'Shift+Tab', description: t('hotkeys.shiftTab') },
        { keys: `${mod}+Z`, description: t('hotkeys.undo') },
        { keys: redoKeys, description: t('hotkeys.redo') },
        { keys: `${mod}+Shift+K`, description: t('hotkeys.deleteLine') },
        { keys: `${mod}+A`, description: t('hotkeys.selectAll') },
        { keys: `${mod}+/`, description: t('hotkeys.toggleComment') },
      ],
    },
    {
      title: t('hotkeys.sectionCursor'),
      hints: [
        {
          keys: `${wordMod}+← / →`,
          description: t('hotkeys.wordMove'),
        },
        {
          keys: `${mod}+Shift+← / →`,
          description: apple ? t('hotkeys.wordSelectMac') : t('hotkeys.wordSelect'),
        },
        {
          keys: apple ? `${mod}+← / →` : 'Home / End',
          description: t('hotkeys.lineBoundary'),
        },
        { keys: `${mod}+Home / End`, description: t('hotkeys.docBoundary') },
        {
          keys: `${mod}+Backspace / Delete`,
          description: apple ? t('hotkeys.deleteLineBoundary') : t('hotkeys.deleteGroup'),
        },
      ],
    },
    {
      title: t('hotkeys.sectionLine'),
      hints: [
        { keys: 'Alt+↑ / ↓', description: t('hotkeys.moveLine') },
        { keys: 'Shift+Alt+↑ / ↓', description: t('hotkeys.copyLine') },
        { keys: `${mod}+Alt+↑ / ↓`, description: t('hotkeys.addCursor') },
      ],
    },
    {
      title: t('hotkeys.sectionView'),
      hints: [
        {
          keys: t('hotkeys.shiftWheelKeys'),
          description: t('hotkeys.shiftWheel'),
        },
      ],
    },
  ];
}
