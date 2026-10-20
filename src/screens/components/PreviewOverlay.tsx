import { lazy, Suspense, useState } from 'react';
import { cn } from '../../utils/cn';

const MarkdownPreview = lazy(async () => {
  const mod = await import('../../preview/MarkdownPreview');
  return { default: mod.MarkdownPreview };
});

type PreviewOverlayProps = {
  open: boolean;
  supportsPreview: boolean;
  source: string;
};

export function PreviewOverlay({
  open,
  supportsPreview,
  source,
}: PreviewOverlayProps) {
  const [mounted, setMounted] = useState(false);
  if (open && !mounted) {
    setMounted(true);
  }

  if (!mounted) {
    return null;
  }

  return (
    <div
      className={cn(
        'absolute inset-0 z-20 overflow-auto bg-(--app-bg)',
        open ? 'z-20' : 'pointer-events-none invisible z-0',
      )}
      aria-hidden={!open}
      aria-label="预览"
    >
      {supportsPreview
        ? (
          <Suspense
            fallback={<p className={cn('p-4 text-sm text-(--app-muted)')}>加载预览…</p>}
          >
            <MarkdownPreview source={source} />
          </Suspense>
        )
        : <p className={cn('p-4 text-sm text-(--app-muted)')}>不支持预览</p>}
    </div>
  );
}
