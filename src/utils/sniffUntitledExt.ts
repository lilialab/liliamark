/**
 * 从未命名空文档的首次粘贴内容嗅探后缀。
 * 仅在高置信结构化格式上返回扩展名；认不出或应保持默认 Markdown 时返回 null。
 */
export function sniffUntitledExt(content: string): string | null {
  const text = content.replace(/^\uFEFF/, '').trim();
  if (!text) {
    return null;
  }

  return sniffJson(text) ?? sniffHtml(text) ?? sniffXml(text);
}

function sniffJson(text: string): string | null {
  const head = text[0];
  if (head !== '{' && head !== '[') {
    return null;
  }
  try {
    const value: unknown = JSON.parse(text);
    if (value !== null && typeof value === 'object') {
      return 'json';
    }
  } catch {
    return null;
  }
  return null;
}

function sniffHtml(text: string): string | null {
  if (/^<!DOCTYPE\s+html\b/i.test(text) || /^<(?:html|head|body)\b/i.test(text)) {
    return 'html';
  }
  return null;
}

function sniffXml(text: string): string | null {
  if (/^<\?xml\b/i.test(text)) {
    return 'xml';
  }
  return null;
}
