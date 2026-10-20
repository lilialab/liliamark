import type { AppSettings } from '../types/appSettings';

/** 有内容则写入；空则 null（调用方 removeProperty，回落 :root） */
export function resolvedFontVar(value: string): string | null {
  const trimmed = value.trim();
  return trimmed || null;
}

/** 把字体栈写到 html 的 --app-font；空则 removeProperty（保存 / 启动时调用） */
export function applyAppFonts(settings: AppSettings): void {
  const next = resolvedFontVar(settings.fontFamily);
  const root = document.documentElement.style;
  if (next !== null) {
    root.setProperty('--app-font', next);
    return;
  }
  root.removeProperty('--app-font');
}
