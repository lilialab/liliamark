import type { AppSettings } from '../types/appSettings';

export const DEFAULT_FONT_SIZE = 16;
export const MIN_FONT_SIZE = 8;
export const MAX_FONT_SIZE = 72;

/** 有内容则写入；空则 null（调用方 removeProperty，回落 :root） */
export function resolvedFontVar(value: string): string | null {
  const trimmed = value.trim();
  return trimmed || null;
}

/** 8–72 的正整数则返回；否则 null（设置页禁止保存） */
export function parseFontSizeInput(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }
  const n = Number(trimmed);
  if (!Number.isInteger(n) || n < MIN_FONT_SIZE || n > MAX_FONT_SIZE) {
    return null;
  }
  return n;
}

/** 把字体栈与字号写到 html；font-family 空则 removeProperty（保存 / 启动时调用） */
export function applyAppFonts(settings: AppSettings): void {
  const root = document.documentElement.style;
  const next = resolvedFontVar(settings.fontFamily);
  if (next !== null) {
    root.setProperty('--app-font', next);
  } else {
    root.removeProperty('--app-font');
  }
  root.setProperty('--app-font-size', `${settings.fontSize}px`);
}
