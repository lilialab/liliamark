import { type LucideIcon, Menu } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { cn } from '../../utils/cn';

export type AppMenuItem = {
  id: string;
  label: string;
  onSelect: () => void;
  /** 有语义再加；无图标仍占位，保证文字对齐 */
  icon?: LucideIcon;
};

export type AppMenuSeparator = {
  id: string;
  separator: true;
};

export type AppMenuEntry = AppMenuItem | AppMenuSeparator;

type AppMenuProps = {
  items: AppMenuEntry[];
};

function isSeparator(entry: AppMenuEntry): entry is AppMenuSeparator {
  return 'separator' in entry && entry.separator;
}

/** 应用菜单；图标触发，absolute 浮层右对齐 */
export function AppMenu({ items }: AppMenuProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: PointerEvent) {
      const root = rootRef.current;
      if (root && !root.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn('relative shrink-0 self-center')}>
      <Button
        variant="ghost"
        className={cn('flex size-8 items-center justify-center')}
        aria-label={t('menu.aria')}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => {
          setOpen((prev) => !prev);
        }}
      >
        <Menu className={cn('size-4')} aria-hidden />
      </Button>

      {open && (
        <div
          id={menuId}
          role="menu"
          className={cn(
            'absolute top-full right-0 z-40 mt-1 min-w-40 overflow-hidden rounded-md',
            'border border-(--app-border) bg-(--app-bg-raised) py-1 shadow-lg',
          )}
        >
          {items.map((entry) => {
            if (isSeparator(entry)) {
              return (
                <div
                  key={entry.id}
                  role="separator"
                  className={cn('my-1 border-t border-(--app-border)')}
                />
              );
            }
            const Icon = entry.icon;
            return (
              <Button
                key={entry.id}
                variant="menu"
                role="menuitem"
                className={cn('flex items-center gap-2')}
                onClick={() => {
                  setOpen(false);
                  entry.onSelect();
                }}
              >
                <span className={cn('flex size-4 shrink-0 items-center justify-center')}>
                  {Icon && <Icon className={cn('size-4')} aria-hidden />}
                </span>
                <span className={cn('min-w-0 flex-1')}>{entry.label}</span>
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}
