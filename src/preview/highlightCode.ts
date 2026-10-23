import hljs from 'highlight.js/lib/common';
import properties from 'highlight.js/lib/languages/properties';

/*
 * 预览围栏输出 HTML，用 highlight.js/lib/common。
 * @codemirror/language-data 只服务 CodeMirror，不能复用到这里。
 * common 未收录的再单独 register。
 */
hljs.registerLanguage('properties', properties);

/** 围栏代码高亮；未知语言返回 null，由调用方转义 */
export function highlightCode(code: string, language: string): string | null {
  const lang = language.trim().toLowerCase();
  if (!lang || !hljs.getLanguage(lang)) {
    return null;
  }

  return hljs.highlight(code, { language: lang, ignoreIllegals: true }).value;
}
