import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { AppLocalePreference } from '../types/appSettings';
import en from './locales/en.json';
import zh from './locales/zh.json';

export type ResolvedLocale = 'zh' | 'en';

/** 从系统语言推断界面语言 */
export function detectSystemLocale(): ResolvedLocale {
  if (typeof navigator === 'undefined') {
    return 'en';
  }
  const language = (navigator.language || 'en').toLowerCase();
  return language.startsWith('zh') ? 'zh' : 'en';
}

/** 设置偏好 → 实际加载的语言包 */
export function resolveLocale(preference: AppLocalePreference): ResolvedLocale {
  if (preference === 'zh' || preference === 'en') {
    return preference;
  }
  return detectSystemLocale();
}

void i18n.use(initReactI18next).init({
  resources: {
    zh: { translation: zh },
    en: { translation: en },
  },
  lng: detectSystemLocale(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

/** 按偏好切换 i18n 语言 */
export function applyLocalePreference(preference: AppLocalePreference): void {
  void i18n.changeLanguage(resolveLocale(preference));
}

export default i18n;
