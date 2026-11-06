import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/cn';
import type { EditorCaretStatus } from '../../utils/editorStatus';
import { UntitledExtModal } from './UntitledExtModal';

type EditorStatusBarProps = {
  indentSize: number;
  caret: EditorCaretStatus;
  languageName: string;
  /** 已落盘路径；未命名为 null（仅此时可改后缀） */
  path: string | null;
  untitledExt: string;
  onUntitledExtChange: (ext: string) => void;
};

type LanguageLabelProps = {
  label: string;
  onClick?: () => void;
};

function LanguageLabel({ label, onClick }: LanguageLabelProps) {
  const { t } = useTranslation();

  if (!onClick) {
    return <span className={cn('truncate')}>{label}</span>;
  }

  return (
    <button
      type="button"
      className={cn(
        'min-w-0 cursor-pointer truncate rounded-sm px-0.5 -mx-0.5',
        'hover:bg-(--app-surface-hover) hover:text-(--app-fg)',
      )}
      aria-label={t('status.changeFileType')}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

/**
 * 编辑器底栏：语言（未命名可点改后缀）/ 缩进 / 选区 / 字符数 / 行数 / 光标位置。
 */
export function EditorStatusBar({
  languageName,
  indentSize,
  caret,
  path,
  untitledExt,
  onUntitledExtChange,
}: EditorStatusBarProps) {
  const { t } = useTranslation();
  const [extModalOpen, setExtModalOpen] = useState(false);
  const canChangeExt = path === null;

  useEffect(() => {
    if (!canChangeExt) {
      setExtModalOpen(false);
    }
  }, [canChangeExt]);

  const languageLabel = languageName === 'Plain Text'
    ? t('status.plainText')
    : languageName;

  return (
    <>
      <footer
        className={cn(
          'flex min-h-6 shrink-0 items-center gap-3 overflow-hidden',
          'bg-(--app-bg-raised) px-3 font-mono text-xs text-(--app-muted)',
        )}
        aria-label={t('status.aria')}
      >
        <div className={cn('flex min-w-0 items-center gap-3')}>
          <LanguageLabel
            label={languageLabel}
            onClick={canChangeExt
              ? () => {
                setExtModalOpen(true);
              }
              : undefined}
          />
          <span className={cn('shrink-0')}>
            {t('status.indentSpaces', { size: indentSize })}
          </span>
        </div>
        <div className={cn('ml-auto flex shrink-0 items-center gap-3')}>
          {caret.selectedChars > 0 && (
            <span>{t('status.selected', { count: caret.selectedChars })}</span>
          )}
          <span>{t('status.chars', { count: caret.chars })}</span>
          <span>{t('status.lines', { count: caret.lines })}</span>
          <span>
            {t('status.lineCol', { line: caret.line, col: caret.col })}
          </span>
        </div>
      </footer>

      {canChangeExt && (
        <UntitledExtModal
          open={extModalOpen}
          currentExt={untitledExt}
          onClose={() => {
            setExtModalOpen(false);
          }}
          onSelect={(ext) => {
            onUntitledExtChange(ext);
            setExtModalOpen(false);
          }}
        />
      )}
    </>
  );
}
