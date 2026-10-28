import { type KeyboardEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/cn';
import {
  completeUntitledExt,
  normalizeUntitledExt,
  suggestUntitledExt,
} from '../../utils/untitled';

type UntitledExtPickerProps = {
  ext: string;
  onChange: (ext: string) => void;
};

/** 未命名文档：右上角后缀输入；幽灵提示 + Tab 补全 */
export function UntitledExtPicker({ ext, onChange }: UntitledExtPickerProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(ext);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) {
      setDraft(ext);
    }
  }, [ext, focused]);

  const query = draft.trim().replace(/^\./, '').toLowerCase();
  const suggestion = focused ? suggestUntitledExt(draft) : null;
  const ghostSuffix = suggestion !== null && suggestion.startsWith(query) && suggestion !== query
    ? suggestion.slice(query.length)
    : '';

  const widthCh = Math.max(6, (suggestion?.length ?? draft.length) + 2);

  function commit(raw: string) {
    const next = normalizeUntitledExt(raw);
    if (next === null) {
      setDraft(ext);
      return;
    }
    onChange(next);
    setDraft(next);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Tab') {
      event.preventDefault();
      setDraft(completeUntitledExt(draft));
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      commit(ghostSuffix ? `${query}${ghostSuffix}` : draft);
      event.currentTarget.blur();
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      setDraft(ext);
      event.currentTarget.blur();
    }
  }

  return (
    <div
      className={cn(
        'pointer-events-none absolute top-2 right-2 z-10',
        'opacity-45 transition-opacity hover:opacity-100 focus-within:opacity-100',
      )}
    >
      <div className={cn('pointer-events-auto rounded-md bg-(--app-bg-raised)')}>
        <div className={cn('relative')} style={{ width: `${widthCh}ch` }}>
          <div
            aria-hidden
            className={cn(
              'pointer-events-none absolute inset-0 flex items-center overflow-hidden',
              'px-2 py-1 font-mono text-sm',
            )}
          >
            <span className={cn('whitespace-pre text-transparent')}>{draft}</span>
            {ghostSuffix && (
              <span className={cn('whitespace-pre text-(--ctp-overlay0)')}>{ghostSuffix}</span>
            )}
          </div>
          <input
            type="text"
            spellCheck={false}
            autoComplete="off"
            aria-label={t('editor.untitledExt')}
            value={draft}
            className={cn(
              'relative w-full rounded-md bg-transparent px-2 py-1 font-mono text-sm',
              'text-(--app-fg) caret-(--app-fg) outline-none',
              'focus-visible:ring-1 focus-visible:ring-(--app-link)',
            )}
            onChange={(event) => {
              setDraft(event.target.value.toLowerCase());
            }}
            onFocus={() => {
              setFocused(true);
            }}
            onBlur={() => {
              setFocused(false);
              commit(draft);
            }}
            onKeyDown={onKeyDown}
          />
        </div>
      </div>
    </div>
  );
}
