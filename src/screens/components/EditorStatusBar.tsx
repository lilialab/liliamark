import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/cn';
import type { EditorCaretStatus } from '../../utils/editorStatus';
import { UntitledExtModal } from './UntitledExtModal';
import './EditorStatusBar.css';

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
  isTypeFlashing: boolean;
  onClick?: () => void;
};

function LanguageLabel({ label, isTypeFlashing, onClick }: LanguageLabelProps) {
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
        isTypeFlashing && 'editor-status-type-flash',
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
 * 须由上层以 key={tabId} 挂载，切 tab 重挂后不会把旧后缀变化当成一次闪动。
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
  const [isTypeFlashing, setIsTypeFlashing] = useState(false);
  const [prevUntitledExt, setPrevUntitledExt] = useState(untitledExt);
  const canChangeExt = path === null;

  useEffect(() => {
    if (!canChangeExt) {
      setExtModalOpen(false);
    }
  }, [canChangeExt]);

  // 同实例内后缀变了才闪；首挂 prev===value 不闪；切 tab 靠外层 key={tabId} 重挂
  useEffect(() => {
    if (prevUntitledExt === untitledExt) {
      return;
    }
    setPrevUntitledExt(untitledExt);
    setIsTypeFlashing(true);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const id = window.setTimeout(() => {
      setIsTypeFlashing(false);
    }, reduced ? 400 : 750);
    return () => {
      window.clearTimeout(id);
    };
  }, [untitledExt, prevUntitledExt]);

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
            isTypeFlashing={isTypeFlashing}
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
