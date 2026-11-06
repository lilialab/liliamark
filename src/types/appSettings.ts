/** 界面语言偏好；system = 跟随系统 */
export type AppLocalePreference = 'system' | 'zh' | 'en';

/** 允许的空格缩进宽度 */
export const INDENT_SIZES = [2, 4] as const;
export type IndentSize = (typeof INDENT_SIZES)[number];

export type AppSettings = {
  /** 编辑器 / 预览共用 font-family 栈 */
  fontFamily: string;
  /** 编辑器 / 预览共用字号（px）；默认 16 */
  fontSize: number;
  /** 空格缩进宽度；默认 2；仅 2 或 4 */
  indentSize: IndentSize;
  /** 保存前格式化 JSON / Markdown；默认关；超大文档跳过；手动格式化不受影响 */
  formatOnSave: boolean;
  /** 窗口失焦时自动保存已落盘脏标签；默认开；未命名与超大文档跳过 */
  saveOnBlur: boolean;
  /** 未命名文件类型弹框词表；默认见 `default_settings.json`；加载不做逐项校验 */
  untitledExtensions: string[];
  /** 界面语言；Rust 加载时缺字段与默认合并后写回；缺文件 / 坏 JSON 整份默认 */
  locale: AppLocalePreference;
};
