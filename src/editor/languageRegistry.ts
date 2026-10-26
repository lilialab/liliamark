import { LanguageDescription } from '@codemirror/language';
import { languages } from '@codemirror/language-data';
import type { Extension } from '@codemirror/state';
import { fileName } from '../utils/path';

const markdownExtensions = new Set(['md', 'markdown']);
const htmlExtensions = new Set(['html', 'htm']);

function fileExtension(path: string): string {
  const name = fileName(path);
  const dot = name.lastIndexOf('.');
  if (dot <= 0) {
    return '';
  }
  return name.slice(dot + 1).toLowerCase();
}

/** 当前是否提供 Markdown 预览（仅 .md / .markdown） */
export function supportsMarkdownPreview(path: string): boolean {
  return markdownExtensions.has(fileExtension(path));
}

/** 是否用系统默认应用（浏览器）打开预览（.html / .htm） */
export function supportsHtmlBrowserOpen(path: string): boolean {
  return htmlExtensions.has(fileExtension(path));
}

/** 预览层是否有可展示内容（应用内 MD 或浏览器打开 HTML） */
export function supportsPreviewPanel(path: string): boolean {
  return supportsMarkdownPreview(path) || supportsHtmlBrowserOpen(path);
}

/** 是否有整文件语法高亮（markdown 或 language-data 能匹配的扩展名） */
export function hasEditorHighlight(path: string): boolean {
  if (supportsMarkdownPreview(path)) {
    return true;
  }
  return LanguageDescription.matchFilename(languages, fileName(path)) !== null;
}

/**
 * 按路径按需加载语言扩展。
 * Markdown 围栏走 `@codemirror/language-data` 的懒加载表；其它文件用同表按文件名匹配。
 */
export async function loadLanguageExtension(path: string): Promise<Extension> {
  if (supportsMarkdownPreview(path)) {
    const { markdown } = await import('@codemirror/lang-markdown');
    return markdown({ codeLanguages: languages });
  }

  const description = LanguageDescription.matchFilename(languages, fileName(path));
  if (!description) {
    return [];
  }
  return description.load();
}
