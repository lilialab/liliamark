/** 未命名后缀 Tab 补全词表（md/html + 主流配置；仍可输入表外后缀） */
export const UNTITLED_EXTENSIONS = [
  'md',
  'html',
  'json',
  'jsonc',
  'yaml',
  'yml',
  'toml',
  'ini',
  'conf',
  'cfg',
  'env',
  'properties',
  'xml',
  'gitignore',
  'editorconfig',
  'npmrc',
] as const;

/** 新建未命名默认后缀（不必出现在补全表里） */
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

function untitledExtQuery(raw: string): string {
  return raw.trim().replace(/^\./, '').toLowerCase();
}

/** 幽灵 / Tab 建议：当前前缀下的第一个候选；无则 null */
export function suggestUntitledExt(
  raw: string,
  extensions: readonly string[] = UNTITLED_EXTENSIONS,
): string | null {
  const query = untitledExtQuery(raw);
  if (!query) {
    return null;
  }
  return extensions.find((ext) => ext.startsWith(query)) ?? null;
}

/**
 * Tab 补全：有未采纳建议则采纳；否则在同前缀候选间循环；无匹配原样返回。
 */
export function completeUntitledExt(
  raw: string,
  extensions: readonly string[] = UNTITLED_EXTENSIONS,
): string {
  const query = untitledExtQuery(raw);
  const suggestion = suggestUntitledExt(raw, extensions);
  if (suggestion !== null && suggestion !== query) {
    return suggestion;
  }

  const matches = extensions.filter((ext) => ext.startsWith(query));
  const first = matches[0];
  if (first === undefined) {
    return raw;
  }
  const index = matches.indexOf(query);
  if (index >= 0) {
    return matches[(index + 1) % matches.length] ?? first;
  }
  return first;
}

/** 供语言 / 预览判断用的伪路径或真实路径（存盘仍用 tab.path） */
export function tabLanguagePath(tab: TabLanguageRef): string {
  if (tab.path !== null) {
    return tab.path;
  }
  return `untitled.${parseUntitledExt(tab.untitledExt)}`;
}
