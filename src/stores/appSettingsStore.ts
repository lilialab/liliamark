import { create } from 'zustand';
import { applyLocalePreference } from '../i18n';
import { loadAppSettings, saveAppSettings } from '../lib/tauri/storage';
import { applyAppFonts } from '../theme/fonts';
import type { AppLocalePreference, AppSettings } from '../types/appSettings';

/** 与 Rust `AppSettings::default` 对齐；hydrate 前首屏用 */
export function defaultAppSettings(): AppSettings {
  return {
    fontFamily: "Consolas, 'Courier New', monospace",
    fontSize: 16,
    indentStyle: 'space',
    indentSize: 4,
    locale: 'system',
  };
}

function parseLocale(value: string): AppLocalePreference {
  if (value === 'zh' || value === 'en' || value === 'system') {
    return value;
  }
  return 'system';
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
    const loaded = await loadAppSettings();
    const settings: AppSettings = {
      ...loaded,
      locale: parseLocale(loaded.locale),
    };
    set({ settings });
    applySettingsEffects(settings);
  },

  async commit(next) {
    const settings: AppSettings = {
      ...next,
      locale: parseLocale(next.locale),
    };
    await saveAppSettings(settings);
    set({ settings });
    applySettingsEffects(settings);
  },
}));

/** hydrate 前写入 CSS，避免首屏无变量 */
applySettingsEffects(defaultAppSettings());
