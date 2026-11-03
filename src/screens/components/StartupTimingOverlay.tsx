import { useTranslation } from 'react-i18next';
import { AppModal } from '../../components/AppModal';
import { cn } from '../../utils/cn';
import { getLastStartupTiming } from '../../utils/startupTiming';

type StartupTimingOverlayProps = {
  open: boolean;
  onClose: () => void;
};

/** 冷启动耗时（临时调试；上线前可整段删除） */
export function StartupTimingOverlay({ open, onClose }: StartupTimingOverlayProps) {
  const { t } = useTranslation();
  const startupTiming = getLastStartupTiming();

  return (
    <AppModal
      open={open}
      title={t('startup.title')}
      closeLabel={t('startup.close')}
      onClose={onClose}
    >
      <dl className={cn('space-y-2 text-xs')}>
        {startupTiming.map((row) => (
          <div key={row.id} className={cn('flex justify-between gap-4')}>
            <dt>
              <div className={cn('font-mono text-(--app-fg)')}>
                {t(`startup.${row.id}.label`)}
              </div>
              <div className={cn('text-(--app-muted)')}>
                {t(`startup.${row.id}.meaning`)}
              </div>
            </dt>
            <dd className={cn('shrink-0 font-mono text-(--app-fg)')}>{row.durationMs}ms</dd>
          </div>
        ))}
      </dl>
    </AppModal>
  );
}
