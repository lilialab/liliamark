import { lazy, Suspense, useEffect, useState } from 'react';
import { Button } from '../../components/Button';
import { cn } from '../../utils/cn';
import './PreviewOverlay.css';

const PREVIEW_MOTION_MS = 200;

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

/** 预览覆盖层；透明度 + 内容位移/缩放，可打断。 */
export function PreviewOverlay({
  open,
  markdownPreview,
  htmlBrowserOpen,
  source,
  onOpenInBrowser,
}: PreviewOverlayProps) {
  const [mounted, setMounted] = useState(false);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    void import('../../preview/MarkdownPreview');
  }, []);

  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    if (!mounted) {
      return;
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setMounted(false);
      return;
    }

    const hide = window.setTimeout(() => {
      setMounted(false);
    }, PREVIEW_MOTION_MS);
    return () => {
      window.clearTimeout(hide);
    };
  }, [open, mounted]);

  async function handleOpenInBrowser() {
    setOpening(true);
    try {
      await onOpenInBrowser();
    } finally {
      setOpening(false);
    }
  }

  if (!mounted) {
    return null;
  }

  const openAttr = open ? 'true' : 'false';

  return (
    <div
      className={cn(
        'preview-overlay-shell absolute inset-0 z-20 flex flex-col overflow-hidden bg-(--app-bg)',
        !open && 'pointer-events-none',
      )}
      data-open={openAttr}
      aria-hidden={!open}
      aria-label="预览"
    >
      <div
        className={cn('preview-overlay-motion flex min-h-0 flex-1 flex-col')}
        data-open={openAttr}
      >
        <div className={cn('h-1 shrink-0 bg-(--ctp-mauve)')} aria-hidden />
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
    </div>
  );
}
