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
        'bg-neutral-900/25',
      )}
      aria-live="polite"
    >
      <p className={cn('rounded-md bg-white/95 px-5 py-2.5 text-sm text-neutral-900')}>
        松开以打开
      </p>
    </div>
  );
}
