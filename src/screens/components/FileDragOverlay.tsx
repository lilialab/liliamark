import { cn } from '../../utils/cn';

type FileDragOverlayProps = {
  active: boolean;
};

export function FileDragOverlay({ active }: FileDragOverlayProps) {
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
        松开以打开
      </p>
    </div>
  );
}
