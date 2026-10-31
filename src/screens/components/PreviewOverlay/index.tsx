import { lazy, Suspense, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/Button';
import { supportsHtmlBrowserOpen, supportsMarkdownPreview } from '../../../editor/languageRegistry';
import { cn } from '../../../utils/cn';
import './PreviewOverlay.css';

const PREVIEW_MOTION_MS = 200;

const MarkdownPreview = lazy(async () => {
  const mod = await import('../../../preview/MarkdownPreview');
  return { default: mod.MarkdownPreview };
});
type PreviewOverlayProps = {
  open: boolean;
  /** 判类型用（已落盘为真实 path，未命名为 untitled.ext） */
  languagePath: string;
  /** 磁盘路径；未命名为 null，供 HTML「用浏览器打开」 */
  filePath: string | null;
  source: string;
  onOpenInBrowser: () => void | Promise<void>;
};

type PreviewBodyProps = {
  languagePath: string;
  filePath: string | null;
  source: string;
  opening: boolean;
  onOpenInBrowser: () => void;
};

function PreviewBody({
  languagePath,
  filePath,
  source,
  opening,
  onOpenInBrowser,
}: PreviewBodyProps) {
  const { t } = useTranslation();

  if (supportsMarkdownPreview(languagePath)) {
    return (
      <Suspense
        fallback={<p className={cn('p-4 text-sm text-(--app-muted)')}>{t('preview.loading')}</p>}
      >
        <MarkdownPreview source={source} />
      </Suspense>
    );
  }

  if (filePath !== null && supportsHtmlBrowserOpen(filePath)) {
    return (
      <div className={cn('flex flex-col items-start gap-3 p-6')}>
        <p className={cn('text-sm text-(--app-fg)')}>{t('preview.htmlNoInline')}</p>
        <p className={cn('text-sm text-(--app-muted)')}>{t('preview.htmlOpenHint')}</p>
        <Button tabFocusable disabled={opening} onClick={onOpenInBrowser}>
          {opening ? t('preview.opening') : t('preview.openInBrowser')}
        </Button>
      </div>
    );
  }

  return <p className={cn('p-4 text-sm text-(--app-muted)')}>{t('preview.unsupported')}</p>;
}

/** 预览覆盖层；按 languagePath / filePath 后缀自行选择模式。 */
export function PreviewOverlay({
  open,
  languagePath,
  filePath,
  source,
  onOpenInBrowser,
}: PreviewOverlayProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    void import('../../../preview/MarkdownPreview');
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
      aria-label={t('preview.aria')}
    >
      <div
        className={cn('preview-overlay-motion flex min-h-0 flex-1 flex-col')}
        data-open={openAttr}
      >
        <div className={cn('h-1 shrink-0 bg-(--ctp-mauve)')} aria-hidden />
        <div className={cn('min-h-0 flex-1 overflow-auto')}>
          <PreviewBody
            languagePath={languagePath}
            filePath={filePath}
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
