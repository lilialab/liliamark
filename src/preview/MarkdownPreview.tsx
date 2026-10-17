import { cn } from '../utils/cn';
import { renderMarkdown } from './renderMarkdown';

type MarkdownPreviewProps = {
  source: string;
  className?: string;
};

export function MarkdownPreview({ source, className }: MarkdownPreviewProps) {
  const html = renderMarkdown(source);

  return (
    <div
      className={cn('markdown-preview px-6 py-5 leading-relaxed', className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
