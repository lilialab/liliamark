import { create } from 'zustand';
import { parseIndentSize, parseIndentStyle } from '../editor/indent';
import { applyLocalePreference } from '../i18n';
import { loadAppSettings, saveAppSettings } from '../lib/tauri/storage';
import { applyAppFonts } from '../theme/fonts';
import type { AppLocalePreference, AppSettings } from '../types/appSettings';

/** 默认设置（字体为 VS Code Windows 默认栈） */
export function defaultAppSettings(): AppSettings {
  return {
    fontFamily: "Consolas, 'Courier New', monospace",
    fontSize: 16,
    indentStyle: 'space',
    indentSize: 4,
    locale: 'system',
  };
}

function parseLocale(value: string | undefined): AppLocalePreference {
  if (value === 'zh' || value === 'en' || value === 'system') {
    return value;
  }
  return 'system';
}

/** 各字段空值 / 非法 → 对应默认 */
function normalizeSettings(settings: AppSettings): AppSettings {
  const defaults = defaultAppSettings();
  return {
    fontFamily: settings.fontFamily.trim() || defaults.fontFamily,
    fontSize: settings.fontSize === 0 ? defaults.fontSize : settings.fontSize,
    indentStyle: parseIndentStyle(settings.indentStyle),
    indentSize: parseIndentSize(settings.indentSize, defaults.indentSize),
    locale: parseLocale(settings.locale),
  };
}

function applySettingsEffects(settings: AppSettings): void {
  applyAppFonts(settings);
  applyLocalePreference(settings.locale);
}

type AppSettingsStore = {
  settings: AppSettings;
  /** 从磁盘加载并应用到 DOM / 编辑器 */
  hydrate: () => Promise<void>;
  /** 写入磁盘并更新 store + 副作用 */
  commit: (settings: AppSettings) => Promise<void>;
};

export const useAppSettingsStore = create<AppSettingsStore>((set) => ({
  settings: defaultAppSettings(),

  async hydrate() {
    const settings = normalizeSettings(await loadAppSettings());
    set({ settings });
    applySettingsEffects(settings);
  },

  async commit(next) {
    const settings = normalizeSettings(next);
    await saveAppSettings(settings);
    set({ settings });
    applySettingsEffects(settings);
  },
}));

/** 默认字体/字号真源在 defaultAppSettings；模块加载时写入 CSS，避免首屏无变量 */
applySettingsEffects(defaultAppSettings());
