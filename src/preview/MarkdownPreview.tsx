import '@catppuccin/highlightjs/css/catppuccin-variables.css';
import type { MouseEvent } from 'react';
import { openExternalUrl } from '../lib/tauri/opener';
import { cn } from '../utils/cn';
import { isHttpUrl } from '../utils/externalUrl';
import { renderMarkdown } from './renderMarkdown';
import './markdownPreview.css';

type MarkdownPreviewProps = {
  source: string;
  className?: string;
};

function handlePreviewLink(event: MouseEvent<HTMLDivElement>) {
  const anchor = (event.target as HTMLElement).closest('a');
  if (!anchor) {
    return;
  }
  // 禁止在 WebView 内跳转；仅 http(s) 尝试系统浏览器
  event.preventDefault();
  const href = anchor.href;
  if (!isHttpUrl(href)) {
    return;
  }
  void openExternalUrl(href);
}

export function MarkdownPreview({ source, className }: MarkdownPreviewProps) {
  const html = renderMarkdown(source);

  return (
    <div
      className={cn('markdown-preview', className)}
      dangerouslySetInnerHTML={{ __html: html }}
      onClick={handlePreviewLink}
      onAuxClick={handlePreviewLink}
    />
  );
}
