import { Button } from '../../components/Button';
import { cn } from '../../utils/cn';
import { markdownCheatSheet } from '../help/markdownCheatSheet';

type MarkdownCheatSheetOverlayProps = {
  open: boolean;
  onClose: () => void;
};

/** Markdown 常用标记速查（只读）。 */
export function MarkdownCheatSheetOverlay({ open, onClose }: MarkdownCheatSheetOverlayProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className={cn(
        'absolute inset-0 z-30 flex items-center justify-center',
        'bg-(--app-overlay-scrim) p-4',
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Markdown 标记"
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
        <h2 className={cn('mb-1 text-base font-medium text-(--app-fg)')}>Markdown 标记</h2>
        <p className={cn('mb-4 text-xs text-(--app-muted)')}>
          常用写法速查；在编辑区输入对应源码即可。
        </p>

        <dl className={cn('mb-4 space-y-3')}>
          {markdownCheatSheet.map((entry) => (
            <div key={entry.name}>
              <dt className={cn('mb-1 text-sm text-(--app-fg)')}>{entry.name}</dt>
              <dd>
                <pre
                  className={cn(
                    'overflow-x-auto rounded border border-(--app-border) bg-(--app-bg)',
                    'px-3 py-2 font-mono text-xs leading-relaxed whitespace-pre-wrap text-(--app-fg)',
                  )}
                >
                  {entry.example}
                </pre>
              </dd>
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
