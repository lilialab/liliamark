/** 未命名标签建议后缀（无点）；仍可输入列表外合法后缀 */
export const UNTITLED_EXTENSIONS = [
  'md',
  'txt',
  'json',
  'yaml',
  'yml',
  'toml',
  'html',
  'css',
  'js',
  'ts',
] as const;

export type UntitledExtension = (typeof UNTITLED_EXTENSIONS)[number];

export const DEFAULT_UNTITLED_EXT: UntitledExtension = 'md';

/** 推导语言 / 预览用路径时所需的最小 tab 字段 */
export type TabLanguageRef = {
  path: string | null;
  untitledExt: string;
};

/**
 * 规范化后缀：去点、小写；允许列表外。
 * 空串或含非法字符时返回 null（由 UI 回退上次合法值）。
 */
export function normalizeUntitledExt(value: string): string | null {
  const normalized = value.trim().replace(/^\./, '').toLowerCase();
  if (!normalized || normalized.length > 32) {
    return null;
  }
  if (!/^[a-z0-9]+(?:[._+-][a-z0-9]+)*$/.test(normalized)) {
    return null;
  }
  return normalized;
}

/** 规范化失败时回落默认 md（语言路径等内层使用） */
export function parseUntitledExt(value: string): string {
  return normalizeUntitledExt(value) ?? DEFAULT_UNTITLED_EXT;
}

/** 供语言 / 预览判断用的伪路径或真实路径（存盘仍用 tab.path） */
export function tabLanguagePath(tab: TabLanguageRef): string {
  if (tab.path !== null) {
    return tab.path;
  }
  return `untitled.${parseUntitledExt(tab.untitledExt)}`;
}
