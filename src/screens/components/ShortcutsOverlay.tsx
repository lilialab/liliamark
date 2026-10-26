import { Button } from '../../components/Button';
import { cn } from '../../utils/cn';
import { editorHotkeyHintSections } from '../help/editorHotkeyHints';

type ShortcutsOverlayProps = {
  open: boolean;
  onClose: () => void;
};

/** 应用快捷键说明（只读，不可改键）。 */
export function ShortcutsOverlay({ open, onClose }: ShortcutsOverlayProps) {
  if (!open) {
    return null;
  }

  const sections = editorHotkeyHintSections();

  return (
    <div
      className={cn(
        'absolute inset-0 z-30 flex items-center justify-center',
        'bg-(--app-overlay-scrim) p-4',
      )}
      role="dialog"
      aria-modal="true"
      aria-label="快捷键"
      onClick={onClose}
    >
      <div
        className={cn(
          'w-full max-w-xl max-h-[80vh] overflow-y-auto',
          'rounded-md border border-(--app-border) bg-(--app-bg-raised) p-4 shadow-lg',
        )}
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <h2 className={cn('mb-1 text-base font-medium text-(--app-fg)')}>快捷键</h2>
        <p className={cn('mb-4 text-xs text-(--app-muted)')}>当前版本固定绑定，暂不支持修改。</p>

        <div className={cn('mb-4 space-y-4')}>
          {sections.map((section) => (
            <section key={section.title}>
              <h3 className={cn('mb-2 text-xs font-medium tracking-wide text-(--app-muted)')}>
                {section.title}
              </h3>
              <ul
                className={cn(
                  'overflow-hidden rounded-md border border-(--app-border)',
                  'divide-y divide-(--app-border)',
                )}
              >
                {section.hints.map((hint) => (
                  <li
                    key={`${section.title}-${hint.keys}`}
                    className={cn(
                      'flex items-start justify-between gap-4 px-3 py-2.5',
                      'bg-(--app-bg)',
                    )}
                  >
                    <kbd
                      className={cn(
                        'shrink-0 rounded border border-(--app-border) bg-(--app-bg-raised)',
                        'px-1.5 py-0.5 font-mono text-xs text-(--app-fg)',
                      )}
                    >
                      {hint.keys}
                    </kbd>
                    <span className={cn('min-w-0 flex-1 text-right text-sm text-(--app-muted)')}>
                      {hint.description}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className={cn('flex justify-end')}>
          <Button tabFocusable onClick={onClose}>
            关闭
          </Button>
        </div>
      </div>
    </div>
  );
}
