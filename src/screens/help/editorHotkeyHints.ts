/**
 * 快捷键说明（只读）。
 * 应用级对齐 `useEditorHotkeys` / `markdownBoldKeymap` / `indentKeymap`；
 * 编辑器级摘自 CodeMirror `defaultKeymap` / `historyKeymap`（非整表）。
 */

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
  mod: string = modifierKeyLabel(),
): EditorHotkeyHintSection[] {
  const apple = isApplePlatform();
  const wordMod = apple ? '⌥' : mod;
  const redoKeys = apple ? `${mod}+Shift+Z` : `${mod}+Y`;

  return [
    {
      title: '应用',
      hints: [
        { keys: `${mod}+S`, description: '保存当前文件' },
        { keys: `${mod}+E`, description: '切换 Markdown 预览 / HTML「用浏览器打开」' },
        { keys: `${mod}+W`, description: '关闭当前标签' },
        { keys: `${mod}+Q`, description: '关闭窗口（有未保存改动时会确认）' },
      ],
    },
    {
      title: '编辑',
      hints: [
        { keys: `${mod}+B`, description: '加粗：选区包/解 **；无选区插入 **** 并置于中间' },
        { keys: 'Tab', description: '插入缩进；有选区时整块增加缩进' },
        { keys: 'Shift+Tab', description: '减少缩进' },
        { keys: `${mod}+Z`, description: '撤销' },
        { keys: redoKeys, description: '重做' },
        { keys: `${mod}+Shift+K`, description: '删除当前行' },
        { keys: `${mod}+A`, description: '全选（编辑区外触发时会先聚焦编辑器）' },
        { keys: `${mod}+/`, description: '切换行注释' },
      ],
    },
    {
      title: '光标与选区',
      hints: [
        {
          keys: `${wordMod}+← / →`,
          description: '按词移动；加 Shift 扩展选区',
        },
        {
          keys: `${mod}+Shift+← / →`,
          description: apple
            ? '按词扩展选区（等同 ⌥+Shift+方向）'
            : '按词扩展选区',
        },
        {
          keys: apple ? `${mod}+← / →` : 'Home / End',
          description: apple ? '移到行首 / 行尾' : '移到行首 / 行尾',
        },
        { keys: `${mod}+Home / End`, description: '移到文档开头 / 结尾' },
        {
          keys: `${mod}+Backspace / Delete`,
          description: apple ? '删除到行首 / 行尾' : '按词删除（前/后）',
        },
      ],
    },
    {
      title: '行',
      hints: [
        { keys: 'Alt+↑ / ↓', description: '上移 / 下移当前行' },
        { keys: 'Shift+Alt+↑ / ↓', description: '向上 / 向下复制当前行' },
        { keys: `${mod}+Alt+↑ / ↓`, description: '在上方 / 下方添加光标' },
      ],
    },
    {
      title: '视图',
      hints: [
        {
          keys: 'Shift+滚轮',
          description: '横向滚动编辑区（不自动换行）',
        },
      ],
    },
  ];
}
