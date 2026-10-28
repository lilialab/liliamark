import { X } from 'lucide-react';
import { useEffect, useEffectEvent, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../utils/cn';
import { Button } from './Button';

export type ConfirmDialogProps = {
  /** 默认 i18n `dialog.title`（提示） */
  title?: string;
  message: string;
  primaryLabel: string;
  secondaryLabel: string;
  closeLabel: string;
  onPrimary: () => void;
  onSecondary: () => void;
  onCancel: () => void;
};

/** 应用内确认：× / Esc / 遮罩 = 取消；主操作 / 次操作由调用方命名 */
export function ConfirmDialog({
  title,
  message,
  primaryLabel,
  secondaryLabel,
  closeLabel,
  onPrimary,
  onSecondary,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  const dialogTitle = title ?? t('dialog.title');
  const titleId = useId();
  const cancel = useEffectEvent(() => {
    onCancel();
  });

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        cancel();
      }
    }

    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
    };
  }, []);

  return (
    <div
      className={cn(
        'absolute inset-0 z-40 flex items-center justify-center',
        'bg-(--app-overlay-scrim) p-4',
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onCancel}
    >
      <div
        className={cn(
          'relative w-full max-w-sm overflow-hidden rounded-md border border-(--app-border)',
          'bg-(--app-bg-raised) shadow-lg',
        )}
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <div
          className={cn(
            'relative flex min-h-10 items-center border-b border-(--app-border)',
            'px-5 py-2.5 pr-11',
          )}
        >
          <h2
            id={titleId}
            className={cn('text-base font-medium text-(--app-fg)')}
          >
            {dialogTitle}
          </h2>
          <Button
            variant="ghost"
            tabFocusable
            className={cn(
              'absolute top-1/2 right-2.5 flex size-7 -translate-y-1/2 items-center justify-center',
            )}
            aria-label={closeLabel}
            onClick={onCancel}
          >
            <X className={cn('size-4')} aria-hidden />
          </Button>
        </div>
        <div className={cn('px-5 pt-4 pb-4')}>
          <p className={cn('text-sm leading-relaxed text-(--app-muted)')}>{message}</p>
          <div className={cn('mt-5 flex justify-end gap-2.5')}>
            <Button
              variant="ghost"
              tabFocusable
              className={cn('rounded border border-transparent px-3 py-1.5')}
              onClick={onSecondary}
            >
              {secondaryLabel}
            </Button>
            <Button tabFocusable onClick={onPrimary}>
              {primaryLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
