import { create } from 'zustand';
import { parseIndentSize, parseIndentStyle } from '../editor/indent';
import { loadAppSettings, saveAppSettings } from '../lib/tauri/storage';
import { applyAppFonts } from '../theme/fonts';
import type { AppSettings } from '../types/appSettings';

/** 默认设置；fontFamily 空串 → apply 时回落 CSS :root */
export function defaultAppSettings(): AppSettings {
  return {
    fontFamily: '',
    fontSize: 16,
    indentStyle: 'space',
    indentSize: 4,
  };
}

/** 磁盘空值（数字 0、非法 indent）→ 默认；fontFamily 空串合法（回落 :root） */
function normalizeSettings(settings: AppSettings): AppSettings {
  const defaults = defaultAppSettings();
  return {
    fontFamily: settings.fontFamily,
    fontSize: settings.fontSize === 0 ? defaults.fontSize : settings.fontSize,
    indentStyle: parseIndentStyle(settings.indentStyle),
    indentSize: parseIndentSize(settings.indentSize, defaults.indentSize),
  };
}

function applySettingsEffects(settings: AppSettings): void {
  applyAppFonts(settings);
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
    try {
      const settings = normalizeSettings(await loadAppSettings());
      set({ settings });
      applySettingsEffects(settings);
    } catch {
      // Browser / non-tauri：保留默认
      applySettingsEffects(defaultAppSettings());
    }
  },

  async commit(next) {
    const settings = normalizeSettings(next);
    await saveAppSettings(settings);
    set({ settings });
    applySettingsEffects(settings);
  },
}));

/** 默认字号真源在 defaultAppSettings；模块加载时写入 CSS，避免首屏无 --app-font-size */
applySettingsEffects(defaultAppSettings());
