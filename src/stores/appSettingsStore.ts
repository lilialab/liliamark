import { create } from 'zustand';
import { applyLocalePreference } from '../i18n';
import { loadAppSettings, saveAppSettings } from '../lib/tauri/storage';
import { applyAppFonts } from '../theme/fonts';
import type { AppLocalePreference, AppSettings } from '../types/appSettings';

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
  /** hydrate 完成前为 null；主界面在 hydrate 之后才挂载 */
  settings: AppSettings | null;
  /** 从磁盘加载并应用到 DOM / 编辑器（默认值只在 Rust） */
  hydrate: () => Promise<void>;
  /** 写入磁盘并更新 store + 副作用 */
  commit: (settings: AppSettings) => Promise<void>;
};

export const useAppSettingsStore = create<AppSettingsStore>((set) => ({
  settings: null,

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

/** 启动阻塞 hydrate 之后使用；未就绪则抛错（回调 / 非 Hook 场景） */
export function getAppSettings(): AppSettings {
  const settings = useAppSettingsStore.getState().settings;
  if (settings === null) {
    throw new Error('App settings not hydrated');
  }
  return settings;
}

/** 组件内订阅已 hydrate 的设置 */
export function useAppSettings(): AppSettings {
  const settings = useAppSettingsStore((state) => state.settings);
  if (settings === null) {
    throw new Error('App settings not hydrated');
  }
  return settings;
}
