import { cn } from '../utils/cn';
import { renderMarkdown } from './renderMarkdown';
import './markdownPreview.css';

type MarkdownPreviewProps = {
  source: string;
  className?: string;
};

export function MarkdownPreview({ source, className }: MarkdownPreviewProps) {
  const html = renderMarkdown(source);

  return (
    <div
      className={cn('markdown-preview', className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
