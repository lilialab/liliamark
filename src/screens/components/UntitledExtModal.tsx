import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { AppModal } from '../../components/AppModal';
import { defaultAppSettings } from '../../lib/tauri/storage';
import { useAppSettings, useAppSettingsStore } from '../../stores/appSettingsStore';
import { cn } from '../../utils/cn';
import { errorMessage } from '../../utils/errorMessage';
import { filterUntitledExtensions, normalizeUntitledExt } from '../../utils/untitled';
import { useConfirmDialog } from '../hooks/useConfirmDialog';

type UntitledExtModalProps = {
  open: boolean;
  currentExt: string;
  onClose: () => void;
  onSelect: (ext: string) => void;
};

/** 未命名文档：底栏扩展名弹框；筛选 / 虚线胶囊添加 / 恢复默认 / 点选 / hover 删除 */
export function UntitledExtModal({
  open,
  currentExt,
  onClose,
  onSelect,
}: UntitledExtModalProps) {
  const { t } = useTranslation();
  const settings = useAppSettings();
  const commit = useAppSettingsStore((state) => state.commit);
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) {
      return;
    }
    setQuery('');
    const id = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
    return () => {
      window.clearTimeout(id);
    };
  }, [open]);

  const filtered = filterUntitledExtensions(query, settings.untitledExtensions);
  const normalizedQuery = normalizeUntitledExt(query);
  const canAdd = normalizedQuery !== null
    && !settings.untitledExtensions.includes(normalizedQuery);
  const showChipRow = filtered.length > 0 || canAdd;

  function selectExt(raw: string) {
    const next = normalizeUntitledExt(raw);
    if (next === null) {
      return;
    }
    onSelect(next);
  }

  async function commitExtensions(untitledExtensions: string[]) {
    await commit({
      ...settings,
      untitledExtensions,
    });
  }

  async function addExt() {
    if (!canAdd || normalizedQuery === null) {
      return;
    }
    try {
      await commitExtensions([...settings.untitledExtensions, normalizedQuery]);
      setQuery('');
    } catch (error) {
      toast.error(t('toast.saveFailed'), { description: errorMessage(error) });
    }
  }

  async function removeExt(ext: string) {
    try {
      await commitExtensions(
        settings.untitledExtensions.filter((item) => item !== ext),
      );
    } catch (error) {
      toast.error(t('toast.saveFailed'), { description: errorMessage(error) });
    }
  }

  async function resetExtList() {
    const result = await confirm({
      message: t('editor.untitledExtResetMessage'),
      primaryLabel: t('editor.untitledExtResetConfirm'),
      secondaryLabel: t('editor.untitledExtResetCancel'),
    });
    if (result !== 'primary') {
      return;
    }
    try {
      const defaults = await defaultAppSettings();
      await commitExtensions(defaults.untitledExtensions);
      setQuery('');
    } catch (error) {
      toast.error(t('toast.saveFailed'), { description: errorMessage(error) });
    }
  }

  return (
    <>
      <AppModal open={open} title={t('editor.untitledExt')} onClose={onClose}>
        <label className={cn('mb-3 block')}>
          <span className={cn('mb-1 block text-xs text-(--app-muted)')}>
            {t('editor.untitledExtFilter')}
          </span>
          <input
            ref={inputRef}
            type="text"
            spellCheck={false}
            autoComplete="off"
            value={query}
            className={cn(
              'w-full rounded border border-(--app-border) bg-(--app-bg) px-3 py-2',
              'font-mono text-sm text-(--app-fg) outline-none',
              'focus:border-(--app-link)',
            )}
            onChange={(event) => {
              setQuery(event.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void addExt();
              }
            }}
          />
        </label>

        {!showChipRow && (
          <p className={cn('text-sm text-(--app-muted)')}>
            {t('editor.untitledExtEmpty')}
          </p>
        )}
        {showChipRow && (
          <div className={cn('flex flex-wrap gap-2')}>
            {filtered.map((ext) => {
              const selected = ext === currentExt;
              return (
                <div
                  key={ext}
                  className={cn(
                    'group relative inline-flex items-center rounded-md border',
                    selected
                      ? 'border-(--app-link) bg-(--app-surface) text-(--app-fg)'
                      : cn(
                        'border-(--app-border) bg-(--app-bg) text-(--app-fg)',
                        'hover:border-(--app-link) hover:bg-(--app-surface-hover)',
                      ),
                  )}
                >
                  <button
                    type="button"
                    className={cn('px-2.5 py-1 font-mono text-sm')}
                    onClick={() => {
                      selectExt(ext);
                    }}
                  >
                    .{ext}
                  </button>
                  <button
                    type="button"
                    className={cn(
                      'absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center',
                      'rounded-sm border border-(--app-border) bg-(--app-bg-raised) text-(--app-muted)',
                      'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
                      'hover:text-(--app-fg)',
                    )}
                    aria-label={t('editor.untitledExtRemove', { ext })}
                    onClick={() => {
                      void removeExt(ext);
                    }}
                  >
                    <X className={cn('size-2.5')} aria-hidden />
                  </button>
                </div>
              );
            })}
            {canAdd && normalizedQuery !== null && (
              <button
                type="button"
                className={cn(
                  'rounded-md border border-dashed border-(--app-border) px-2.5 py-1',
                  'font-mono text-sm text-(--app-muted)',
                  'hover:border-(--app-link) hover:text-(--app-fg)',
                )}
                aria-label={t('editor.untitledExtAdd', { ext: normalizedQuery })}
                onClick={() => {
                  void addExt();
                }}
              >
                + .{normalizedQuery}
              </button>
            )}
          </div>
        )}

        <button
          type="button"
          className={cn('mt-4 text-xs text-(--app-muted) hover:text-(--app-fg)')}
          onClick={() => {
            void resetExtList();
          }}
        >
          {t('editor.untitledExtReset')}
        </button>
      </AppModal>
      {confirmDialog}
    </>
  );
}
