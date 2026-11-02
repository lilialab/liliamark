export type IndentStyle = 'space' | 'tab';

/** 界面语言偏好；system = 跟随系统 */
export type AppLocalePreference = 'system' | 'zh' | 'en';

export type AppSettings = {
  /** 编辑器 / 预览共用 font-family 栈 */
  fontFamily: string;
  /** 编辑器 / 预览共用字号（px）；默认 16 */
  fontSize: number;
  /** 编辑器缩进：空格或制表符 */
  indentStyle: IndentStyle;
  /** 空格个数 / 制表符显示宽度；默认 4（设置页暂不暴露） */
  indentSize: number;
  /** 保存前格式化 JSON / Markdown；默认关；超大文档跳过；手动格式化不受影响 */
  formatOnSave: boolean;
  /** 界面语言；Rust 加载时缺字段与默认合并后写回；缺文件 / 坏 JSON 整份默认 */
  locale: AppLocalePreference;
};
