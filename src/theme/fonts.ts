import type { AppSettings } from '../types/appSettings';

export const MIN_FONT_SIZE = 8;
export const MAX_FONT_SIZE = 72;

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

/** 把字体栈与字号写到 html（调用方保证 fontFamily 非空） */
export function applyAppFonts(settings: AppSettings): void {
  const root = document.documentElement.style;
  root.setProperty('--app-font', settings.fontFamily.trim());
  root.setProperty('--app-font-size', `${settings.fontSize}px`);
}
