export type IndentStyle = 'space' | 'tab';

export type AppSettings = {
  /** 编辑器 / 预览共用 font-family 栈；空则用 :root 默认 */
  fontFamily: string;
  /** 编辑器 / 预览共用字号（px）；默认 16 */
  fontSize: number;
  /** 编辑器缩进：空格或制表符 */
  indentStyle: IndentStyle;
  /** 空格个数 / 制表符显示宽度；默认 4（设置页暂不暴露） */
  indentSize: number;
};
