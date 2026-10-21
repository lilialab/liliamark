import { openUrl } from '@tauri-apps/plugin-opener';
import { isHttpUrl } from '../../utils/externalUrl';

/**
 * 用系统默认浏览器打开 http(s) 链接。
 * 失败（非桌面 / 无浏览器 / 插件错误）时返回 false，不在 WebView 内跳转。
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
