import { Button } from '../../components/Button';
import { cn } from '../../utils/cn';
import { getLastStartupTiming } from '../../utils/startupTiming';

type StartupTimingOverlayProps = {
  open: boolean;
  onClose: () => void;
};

/** 冷启动耗时（临时调试；上线前可整段删除） */
export function StartupTimingOverlay({ open, onClose }: StartupTimingOverlayProps) {
  if (!open) {
    return null;
  }

  const startupTiming = getLastStartupTiming();

  return (
    <div
      className={cn(
        'absolute inset-0 z-30 flex items-center justify-center',
        'bg-(--app-overlay-scrim) p-4',
      )}
      role="dialog"
      aria-modal="true"
      aria-label="启动耗时"
      onClick={onClose}
    >
      <div
        className={cn(
          'w-full max-w-lg max-h-[80vh] overflow-y-auto',
          'rounded-md border border-(--app-border) bg-(--app-bg-raised) p-4 shadow-lg',
        )}
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <h2 className={cn('mb-3 text-base font-medium text-(--app-fg)')}>启动耗时</h2>
        <dl className={cn('mb-4 space-y-2 text-xs')}>
          {startupTiming.map((row) => (
            <div key={row.label} className={cn('flex justify-between gap-4')}>
              <dt>
                <div className={cn('font-mono text-(--app-fg)')}>{row.label}</div>
                <div className={cn('text-(--app-muted)')}>{row.meaning}</div>
              </dt>
              <dd className={cn('shrink-0 font-mono text-(--app-fg)')}>{row.durationMs}ms</dd>
            </div>
          ))}
        </dl>
        <div className={cn('flex justify-end')}>
          <Button tabFocusable onClick={onClose}>
            关闭
          </Button>
        </div>
      </div>
    </div>
  );
}
