import { openPath, openUrl } from '@tauri-apps/plugin-opener';
import { isHttpUrl } from '../../utils/externalUrl';

/**
 * 用系统默认浏览器打开 http(s) 链接。
 * 失败（无浏览器 / 插件错误）时返回 false，不在 WebView 内跳转。
 */
export async function openExternalUrl(href: string): Promise<boolean> {
  if (!isHttpUrl(href)) {
    return false;
  }
  try {
    await openUrl(href);
    return true;
  } catch {
    return false;
  }
}

/**
 * 用系统默认应用打开本地路径（HTML 通常进浏览器）。
 * 失败时返回 false。
 */
export async function openLocalPath(path: string): Promise<boolean> {
  try {
    await openPath(path);
    return true;
  } catch {
    return false;
  }
}
