import { ChevronDown } from 'lucide-react';
import { type KeyboardEvent, useEffect, useEffectEvent, useId, useRef, useState } from 'react';
import { cn } from '../utils/cn';
import { Button } from './Button';

export type ComboboxProps = {
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  /** 提交时规范化；返回 null 则回退为当前 value */
  parse: (raw: string) => string | null;
  /** 触发器与选项展示文案，默认原样 */
  formatOption?: (option: string) => string;
  /** 浮层水平对齐；右上角锚点用 end */
  menuAlign?: 'start' | 'end';
  'aria-label'?: string;
  className?: string;
};

/** 按钮触发的可筛选组合框；浮层内输入可提交列表外值，非法则回退 */
export function Combobox({
  value,
  options,
  onChange,
  parse,
  formatOption = (option) => option,
  menuAlign = 'start',
  'aria-label': ariaLabel,
  className,
}: ComboboxProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [highlight, setHighlight] = useState(0);

  const filtered = options.filter((option) =>
    option.toLowerCase().includes(query.trim().replace(/^\./, '').toLowerCase())
  );

  function commit(raw: string) {
    const next = parse(raw);
    if (next === null) {
      setQuery(value);
      setOpen(false);
      return;
    }
    onChange(next);
    setQuery(next);
    setOpen(false);
  }

  function discard() {
    setQuery(value);
    setOpen(false);
  }

  const commitQuery = useEffectEvent(() => {
    commit(query);
  });
  const discardOpen = useEffectEvent(() => {
    discard();
  });

  useEffect(() => {
    if (!open) {
      setQuery(value);
      return;
    }
    setQuery(value);
    setHighlight(0);
    filterRef.current?.focus();
  }, [open, value]);

  useEffect(() => {
    setHighlight(0);
  }, [query]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: PointerEvent) {
      const root = rootRef.current;
      if (root && !root.contains(event.target as Node)) {
        commitQuery();
      }
    }

    function onWindowKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        discardOpen();
      }
    }

    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onWindowKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onWindowKeyDown);
    };
  }, [open]);

  function onFilterKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (filtered.length === 0) {
        return;
      }
      setHighlight((index) => (index + 1) % filtered.length);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (filtered.length === 0) {
        return;
      }
      setHighlight((index) => (index - 1 + filtered.length) % filtered.length);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const picked = filtered[highlight];
      commit(picked ?? query);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      discard();
    }
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <Button
        variant="ghost"
        className={cn(
          'flex h-7 items-center gap-1 px-2 text-sm text-(--app-fg)',
          open && 'bg-(--app-surface-hover)',
        )}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => {
          if (open) {
            commit(query);
            return;
          }
          setOpen(true);
        }}
      >
        <span>{formatOption(value)}</span>
        <ChevronDown className={cn('size-3.5 opacity-60')} aria-hidden />
      </Button>

      {open && (
        <div
          className={cn(
            'absolute top-full z-50 mt-1 min-w-36 overflow-hidden rounded-md',
            'border border-(--app-border) bg-(--app-bg-raised) shadow-lg',
            menuAlign === 'end' ? 'right-0' : 'left-0',
          )}
        >
          <div className={cn('border-b border-(--app-border) px-2 py-1.5')}>
            <input
              ref={filterRef}
              type="text"
              role="combobox"
              aria-label={ariaLabel}
              aria-expanded={open}
              aria-controls={listId}
              aria-autocomplete="list"
              autoComplete="off"
              spellCheck={false}
              value={query}
              className={cn(
                'w-full rounded-sm bg-(--app-bg) px-2 py-1 text-sm text-(--app-fg)',
                'outline-none focus-visible:ring-1 focus-visible:ring-(--app-link)',
              )}
              onChange={(event) => {
                setQuery(event.target.value);
              }}
              onKeyDown={onFilterKeyDown}
            />
          </div>
          <ul
            id={listId}
            role="listbox"
            className={cn('max-h-40 overflow-y-auto py-1')}
          >
            {filtered.map((option, index) => (
              <li key={option} role="presentation">
                <Button
                  variant="menu"
                  role="option"
                  aria-selected={index === highlight}
                  className={cn(
                    index === highlight && 'bg-(--app-surface-hover)',
                    option === value && 'text-(--app-link)',
                  )}
                  onMouseEnter={() => {
                    setHighlight(index);
                  }}
                  onMouseDown={(event) => {
                    event.preventDefault();
                  }}
                  onClick={() => {
                    commit(option);
                  }}
                >
                  {formatOption(option)}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
