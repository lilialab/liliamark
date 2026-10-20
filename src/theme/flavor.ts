import {
  catppuccinFrappe,
  catppuccinLatte,
  catppuccinMacchiato,
  catppuccinMocha,
} from '@catppuccin/codemirror';
import type { Extension } from '@codemirror/state';

export type AppFlavor = 'latte' | 'frappe' | 'macchiato' | 'mocha';

/** 改这一处即可切换整站 Catppuccin flavor（CSS / 编辑器 / 标题栏 / Toast） */
export const APP_FLAVOR: AppFlavor = 'macchiato';

const codemirrorThemes: Record<AppFlavor, Extension> = {
  latte: catppuccinLatte,
  frappe: catppuccinFrappe,
  macchiato: catppuccinMacchiato,
  mocha: catppuccinMocha,
};

export function isDarkFlavor(flavor: AppFlavor = APP_FLAVOR): boolean {
  return flavor !== 'latte';
}

export function windowThemeForFlavor(flavor: AppFlavor = APP_FLAVOR): 'light' | 'dark' {
  return isDarkFlavor(flavor) ? 'dark' : 'light';
}

export function catppuccinEditorTheme(flavor: AppFlavor = APP_FLAVOR): Extension {
  return codemirrorThemes[flavor];
}

/** 同步挂上 html[data-flavor]，供 CSS 变量别名 */
export function applyDocumentFlavor(flavor: AppFlavor = APP_FLAVOR): void {
  document.documentElement.dataset.flavor = flavor;
}
