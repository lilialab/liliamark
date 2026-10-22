import { Menu } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '../../components/Button';
import { cn } from '../../utils/cn';

export type AppMenuItem = {
  id: string;
  label: string;
  onSelect: () => void;
};

type AppMenuProps = {
  items: AppMenuItem[];
};

/** 应用菜单；图标触发，absolute 浮层右对齐 */
export function AppMenu({ items }: AppMenuProps) {
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
        aria-label="菜单"
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
            'absolute top-full right-0 z-40 mt-1 min-w-36 overflow-hidden rounded-md',
            'border border-(--app-border) bg-(--app-bg-raised) py-1 shadow-lg',
          )}
        >
          {items.map((item) => (
            <Button
              key={item.id}
              variant="menu"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
            >
              {item.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
