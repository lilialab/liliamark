import { X } from 'lucide-react';
import { type ReactNode, useEffect, useEffectEvent, useId } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '../utils/cn';
import { Button } from './Button';

export type AppModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** 默认 i18n `dialog.close` */
  closeLabel?: string;
  /** 面板最大宽度等，默认 max-w-lg */
  panelClassName?: string;
  /** 遮罩层额外 class（如 z-40）；默认 z-30 */
  overlayClassName?: string;
  /** 底栏（如取消/保存）；钉在面板底部 */
  footer?: ReactNode;
};

/**
 * 通用模态框：`createPortal` 到 `document.body`；Esc / 右上角 × 关闭；
 * 顶栏标题；中间可滚动；可选底栏。
 */
export function AppModal({
  open,
  title,
  onClose,
  children,
  closeLabel,
  panelClassName,
  overlayClassName,
  footer,
}: AppModalProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const resolvedCloseLabel = closeLabel ?? t('dialog.close');
  const close = useEffectEvent(() => {
    onClose();
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        close();
      }
    }

    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-30 flex items-center justify-center',
        'bg-(--app-overlay-scrim) p-4',
        overlayClassName,
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        className={cn(
          'relative flex w-full max-h-[80vh] flex-col overflow-hidden rounded-md',
          'border border-(--app-border) bg-(--app-bg-raised) shadow-lg',
          panelClassName ?? 'max-w-lg',
        )}
      >
        <div
          className={cn(
            'relative flex min-h-10 shrink-0 items-center border-b border-(--app-border)',
            'px-5 py-2.5 pr-11',
          )}
        >
          <h2
            id={titleId}
            className={cn('text-base font-medium text-(--app-fg)')}
          >
            {title}
          </h2>
          <Button
            variant="ghost"
            tabFocusable
            className={cn(
              'absolute top-1/2 right-2.5 flex size-7 -translate-y-1/2 items-center justify-center',
            )}
            aria-label={resolvedCloseLabel}
            onClick={onClose}
          >
            <X className={cn('size-4')} aria-hidden />
          </Button>
        </div>

        <div className={cn('min-h-0 flex-1 overflow-y-auto px-5 pt-4 pb-4')}>
          {children}
        </div>

        {footer && (
          <div
            className={cn(
              'shrink-0 border-t border-(--app-border) bg-(--app-bg-raised) px-5 py-3',
            )}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
