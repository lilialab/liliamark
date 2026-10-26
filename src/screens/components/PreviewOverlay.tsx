import { lazy, Suspense, useState } from 'react';
import { Button } from '../../components/Button';
import { cn } from '../../utils/cn';

const MarkdownPreview = lazy(async () => {
  const mod = await import('../../preview/MarkdownPreview');
  return { default: mod.MarkdownPreview };
});

type PreviewOverlayProps = {
  open: boolean;
  /** 应用内 Markdown 预览 */
  markdownPreview: boolean;
  /** HTML：不内嵌预览，提供浏览器打开 */
  htmlBrowserOpen: boolean;
  source: string;
  onOpenInBrowser: () => void | Promise<void>;
};

type PreviewBodyProps = {
  markdownPreview: boolean;
  htmlBrowserOpen: boolean;
  source: string;
  opening: boolean;
  onOpenInBrowser: () => void;
};

function PreviewBody({
  markdownPreview,
  htmlBrowserOpen,
  source,
  opening,
  onOpenInBrowser,
}: PreviewBodyProps) {
  if (markdownPreview) {
    return (
      <Suspense
        fallback={<p className={cn('p-4 text-sm text-(--app-muted)')}>加载预览…</p>}
      >
        <MarkdownPreview source={source} />
      </Suspense>
    );
  }

  if (htmlBrowserOpen) {
    return (
      <div className={cn('flex flex-col items-start gap-3 p-6')}>
        <p className={cn('text-sm text-(--app-fg)')}>
          HTML 不在应用内预览，以免执行页面脚本。
        </p>
        <p className={cn('text-sm text-(--app-muted)')}>
          可用系统默认浏览器（或其它关联应用）打开当前文件。未保存的修改不会出现在浏览器里。
        </p>
        <Button tabFocusable disabled={opening} onClick={onOpenInBrowser}>
          {opening ? '正在打开…' : '用浏览器打开'}
        </Button>
      </div>
    );
  }

  return <p className={cn('p-4 text-sm text-(--app-muted)')}>不支持预览</p>;
}

export function PreviewOverlay({
  open,
  markdownPreview,
  htmlBrowserOpen,
  source,
  onOpenInBrowser,
}: PreviewOverlayProps) {
  const [mounted, setMounted] = useState(false);
  const [opening, setOpening] = useState(false);

  if (open && !mounted) {
    setMounted(true);
  }

  if (!mounted) {
    return null;
  }

  async function handleOpenInBrowser() {
    setOpening(true);
    try {
      await onOpenInBrowser();
    } finally {
      setOpening(false);
    }
  }

  return (
    <div
      className={cn(
        'absolute inset-0 z-20 flex flex-col bg-(--app-bg)',
        open ? 'z-20' : 'pointer-events-none invisible z-0',
      )}
      aria-hidden={!open}
      aria-label="预览"
    >
      <div
        className={cn('h-1 shrink-0 bg-(--ctp-mauve)')}
        aria-hidden
      />
      <div className={cn('min-h-0 flex-1 overflow-auto')}>
        <PreviewBody
          markdownPreview={markdownPreview}
          htmlBrowserOpen={htmlBrowserOpen}
          source={source}
          opening={opening}
          onOpenInBrowser={() => {
            void handleOpenInBrowser();
          }}
        />
      </div>
    </div>
  );
}
