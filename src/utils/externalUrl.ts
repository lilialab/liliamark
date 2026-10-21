/** 是否为可用系统浏览器打开的 http(s) URL */
export function isHttpUrl(href: string): boolean {
  try {
    const url = new URL(href);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/** 从源码片段规范化出 http(s) URL；失败返回 null */
export function normalizeHttpUrl(raw: string): string | null {
  let text = raw.trim();
  if (text.startsWith('<') && text.endsWith('>')) {
    text = text.slice(1, -1).trim();
  }
  if (isHttpUrl(text)) {
    return new URL(text).href;
  }
  return null;
}
