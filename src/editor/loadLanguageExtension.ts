import type { Extension } from '@codemirror/state';
import type { EditorLanguageKind } from './editorLanguageKind';

/** 按需加载语言扩展；plaintext 不加载语言包 */
export async function loadLanguageExtension(kind: EditorLanguageKind): Promise<Extension> {
  if (kind === 'markdown') {
    const { markdown } = await import('@codemirror/lang-markdown');
    return markdown();
  }
  if (kind === 'json') {
    const { json } = await import('@codemirror/lang-json');
    return json();
  }
  return [];
}
