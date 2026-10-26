/** Markdown 常用标记速查（只读文案）。 */

export type MarkdownCheatSheetEntry = {
  name: string;
  example: string;
};

/** 一屏常用语法；含表格。 */
export const markdownCheatSheet: MarkdownCheatSheetEntry[] = [
  { name: '标题', example: '# 一级\n## 二级\n### 三级' },
  { name: '粗体 / 斜体', example: '**粗体**  *斜体*' },
  { name: '无序列表', example: '- 项目\n- 项目' },
  { name: '有序列表', example: '1. 第一项\n2. 第二项' },
  { name: '任务列表', example: '- [ ] 待办\n- [x] 已完成' },
  { name: '链接', example: '[文字](https://example.com)' },
  {
    name: '表格',
    example: '| 列 A | 列 B |\n| --- | --- |\n| 单元格 | 单元格 |',
  },
];
