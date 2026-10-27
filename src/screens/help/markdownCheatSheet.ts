/** Markdown 常用标记条目 id；文案与示例在 i18n `cheatSheet.*`。 */

export const markdownCheatSheetIds = [
  'heading',
  'boldItalic',
  'ul',
  'ol',
  'task',
  'link',
  'image',
  'inlineCode',
  'codeBlock',
  'quote',
  'table',
] as const;

export type MarkdownCheatSheetId = (typeof markdownCheatSheetIds)[number];
