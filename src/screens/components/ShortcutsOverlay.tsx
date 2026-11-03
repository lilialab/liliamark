import { useTranslation } from 'react-i18next';
import { AppModal } from '../../components/AppModal';
import { cn } from '../../utils/cn';
import { editorHotkeyHintSections } from '../help/editorHotkeyHints';

type ShortcutsOverlayProps = {
  open: boolean;
  onClose: () => void;
};

/** 应用快捷键说明（只读，不可改键）。 */
export function ShortcutsOverlay({ open, onClose }: ShortcutsOverlayProps) {
  const { t } = useTranslation();
  const sections = editorHotkeyHintSections(t);

  return (
    <AppModal
      open={open}
      title={t('shortcuts.title')}
      closeLabel={t('shortcuts.close')}
      panelClassName={cn('max-w-xl')}
      onClose={onClose}
    >
      <p className={cn('mb-4 text-xs text-(--app-muted)')}>{t('shortcuts.hint')}</p>

      <div className={cn('space-y-4')}>
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
    </AppModal>
  );
}
