import { fileName } from '../utils/path';

export type EditorLanguageKind = 'markdown' | 'json' | 'plaintext';

/** 按文件扩展名决定编辑器语言（大小写不敏感） */
export function editorLanguageKind(path: string): EditorLanguageKind {
  const name = fileName(path).toLowerCase();
  if (name.endsWith('.md') || name.endsWith('.markdown')) {
    return 'markdown';
  }
  if (name.endsWith('.json')) {
    return 'json';
  }
  return 'plaintext';
}

/** 当前是否提供 Markdown 预览（仅 .md / .markdown） */
export function supportsMarkdownPreview(path: string): boolean {
  return editorLanguageKind(path) === 'markdown';
}
