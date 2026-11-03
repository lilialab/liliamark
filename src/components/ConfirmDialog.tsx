import { useTranslation } from 'react-i18next';
import { cn } from '../utils/cn';
import { AppModal } from './AppModal';
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

  return (
    <AppModal
      open
      title={dialogTitle}
      closeLabel={closeLabel}
      panelClassName={cn('max-w-sm')}
      overlayClassName={cn('z-40')}
      onClose={onCancel}
      footer={
        <div className={cn('flex justify-end gap-2.5')}>
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
      }
    >
      <p className={cn('text-sm leading-relaxed text-(--app-muted)')}>{message}</p>
    </AppModal>
  );
}
