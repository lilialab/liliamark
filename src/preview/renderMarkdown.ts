import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({ html: false, linkify: true });

/** 将 Markdown 原文转为 HTML */
export function renderMarkdown(source: string): string {
  return md.render(source);
}
