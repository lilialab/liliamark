import { getCurrentWindow } from '@tauri-apps/api/window';

/** 设置窗口标题栏明暗（light / dark） */
export async function setWindowTheme(theme: 'light' | 'dark'): Promise<void> {
  await getCurrentWindow().setTheme(theme);
}
