import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/cn';
import type { EditorCaretStatus } from '../../utils/editorStatus';

type EditorStatusBarProps = {
  indentSize: number;
  caret: EditorCaretStatus;
  languageName: string;
};

/**
 * 编辑器底栏：纯展示语言 / 缩进 / 选区 / 字符数 / 行数 / 光标位置。
 */
export function EditorStatusBar({
  languageName,
  indentSize,
  caret,
}: EditorStatusBarProps) {
  const { t } = useTranslation();
  const languageLabel = languageName === 'Plain Text'
    ? t('status.plainText')
    : languageName;

  return (
    <footer
      className={cn(
        'flex min-h-6 shrink-0 items-center gap-3 overflow-hidden',
        'bg-(--app-bg-raised) px-3 font-mono text-xs text-(--app-muted)',
      )}
      aria-label={t('status.aria')}
    >
      <div className={cn('flex min-w-0 items-center gap-3')}>
        <span className={cn('truncate')}>{languageLabel}</span>
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
  );
}
