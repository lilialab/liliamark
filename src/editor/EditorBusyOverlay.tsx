import { useEffect, useState } from 'react';
import { cn } from '../utils/cn';

const REVEAL_DELAY_MS = 300;

type EditorBusyOverlayProps = {
  message: string;
};

/**
 * 立刻盖住编辑区防误操作；满 REVEAL_DELAY_MS 再淡入 scrim / 文案。
 * 短操作结束则几乎只挡一下、看不见提示。
 */
export function EditorBusyOverlay({ message }: EditorBusyOverlayProps) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setRevealed(true);
    }, REVEAL_DELAY_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div
      className={cn('absolute inset-0 z-10 flex items-center justify-center')}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className={cn(
          'absolute inset-0 bg-(--app-overlay-scrim) transition-opacity duration-150',
          'motion-reduce:transition-none',
          revealed ? 'opacity-100' : 'opacity-0',
        )}
        aria-hidden
      />
      <div
        className={cn(
          'relative flex items-center gap-3 rounded-md bg-(--app-overlay-card) px-5 py-2.5',
          'text-sm text-(--app-fg) transition-opacity duration-150 motion-reduce:transition-none',
          revealed ? 'opacity-100' : 'opacity-0',
        )}
      >
        <span
          className={cn(
            'size-4 shrink-0 animate-spin rounded-full border-2 border-(--app-muted)',
            'border-t-(--app-fg) motion-reduce:animate-none',
          )}
          aria-hidden
        />
        {message}
      </div>
    </div>
  );
}
