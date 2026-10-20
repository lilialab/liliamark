import MarkdownIt from 'markdown-it';
import { highlightCode } from './highlightCode';

const md = new MarkdownIt({ html: false, linkify: true });

md.options.highlight = (code, language): string => {
  const highlighted = highlightCode(code, language);
  const langClass = language ? ` language-${md.utils.escapeHtml(language)}` : '';
  const body = highlighted ?? md.utils.escapeHtml(code);
  return `<pre><code class="hljs${langClass}">${body}</code></pre>`;
};

/** 将 Markdown 原文转为 HTML */
export function renderMarkdown(source: string): string {
  return md.render(source);
}
