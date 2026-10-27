import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/cn';

type FileDragOverlayProps = {
  active: boolean;
};

export function FileDragOverlay({ active }: FileDragOverlayProps) {
  const { t } = useTranslation();

  if (!active) {
    return null;
  }

  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 z-50 flex items-center justify-center',
        'bg-(--app-overlay-scrim)',
      )}
      aria-live="polite"
    >
      <p
        className={cn(
          'rounded-md bg-(--app-overlay-card) px-5 py-2.5 text-sm text-(--app-fg)',
        )}
      >
        {t('drag.releaseToOpen')}
      </p>
    </div>
  );
}
