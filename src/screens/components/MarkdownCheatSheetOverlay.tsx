import { useTranslation } from 'react-i18next';
import { AppModal } from '../../components/AppModal';
import { cn } from '../../utils/cn';
import { markdownCheatSheetIds } from '../help/markdownCheatSheet';

type MarkdownCheatSheetOverlayProps = {
  open: boolean;
  onClose: () => void;
};

/** Markdown 常用标记速查（只读）。 */
export function MarkdownCheatSheetOverlay({ open, onClose }: MarkdownCheatSheetOverlayProps) {
  const { t } = useTranslation();

  return (
    <AppModal
      open={open}
      title={t('cheatSheet.title')}
      closeLabel={t('cheatSheet.close')}
      onClose={onClose}
    >
      <p className={cn('mb-4 text-xs text-(--app-muted)')}>{t('cheatSheet.hint')}</p>

      <dl className={cn('space-y-3')}>
        {markdownCheatSheetIds.map((id) => (
          <div key={id}>
            <dt className={cn('mb-1 text-sm text-(--app-fg)')}>
              {t(`cheatSheet.${id}.name`)}
            </dt>
            <dd>
              <pre
                className={cn(
                  'overflow-x-auto rounded border border-(--app-border) bg-(--app-bg)',
                  'px-3 py-2 font-mono text-xs leading-relaxed whitespace-pre-wrap text-(--app-fg)',
                )}
              >
                {t(`cheatSheet.${id}.example`)}
              </pre>
            </dd>
          </div>
        ))}
      </dl>
    </AppModal>
  );
}
