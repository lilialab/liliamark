/** 新建未命名默认后缀 */
export const DEFAULT_UNTITLED_EXT = 'md';

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

/** 弹框筛选：空查询返回全部；否则按前缀匹配（词表由调用方传入，通常来自 settings） */
export function filterUntitledExtensions(
  raw: string,
  extensions: readonly string[],
): string[] {
  const query = raw.trim().replace(/^\./, '').toLowerCase();
  if (!query) {
    return [...extensions];
  }
  return extensions.filter((ext) => ext.startsWith(query));
}

/** 供语言 / 预览判断用的伪路径或真实路径（存盘仍用 tab.path） */
export function tabLanguagePath(tab: TabLanguageRef): string {
  if (tab.path !== null) {
    return tab.path;
  }
  return `untitled.${parseUntitledExt(tab.untitledExt)}`;
}
