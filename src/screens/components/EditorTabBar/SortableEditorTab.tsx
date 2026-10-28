import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X } from 'lucide-react';
import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/Button';
import { cn } from '../../../utils/cn';
import type { EditorTabBarItem } from './types';

type SortableEditorTabProps = {
  tab: EditorTabBarItem;
  active: boolean;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
};

export function SortableEditorTab({ tab, active, onSelect, onClose }: SortableEditorTabProps) {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: tab.id,
  });

  const style: CSSProperties = {
    // 只用 Translate，避免 Transform 带上 scale 导致拖拽时宽度被挤/拉
    // 标签条只允许横向位移，避免指针上下移时其它 tab 跟着飞
    transform: CSS.Translate.toString(transform ? { ...transform, y: 0 } : null),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex max-w-48 shrink-0 cursor-pointer items-center gap-1.5 px-3 text-sm',
        active
          ? 'bg-(--app-bg) text-(--app-fg)'
          : 'bg-transparent text-(--app-muted) hover:bg-(--app-surface)',
        isDragging && 'z-10 opacity-80',
      )}
      {...attributes}
      {...listeners}
      tabIndex={-1}
      role="tab"
      aria-selected={active}
    >
      <Button
        variant="ghost"
        className={cn(
          'flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 py-1.5 text-left text-(--app-fg)',
          'hover:bg-transparent',
          !active && 'text-(--app-muted)',
        )}
        onClick={() => {
          onSelect(tab.id);
        }}
      >
        <span className={cn('min-w-0 truncate')}>{tab.title}</span>
        {tab.diskChange && (
          <span
            className={cn('shrink-0 text-(--app-warn-fg)')}
            title={t('editor.diskChanged')}
          >
            !
          </span>
        )}
      </Button>
      <Button
        variant="ghost"
        className={cn(
          'group/close flex size-5 shrink-0 cursor-pointer items-center justify-center',
          'hover:bg-transparent',
          active || tab.dirty ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
        )}
        aria-label={t('editor.closeTab', { title: tab.title })}
        onPointerDown={(event) => {
          event.stopPropagation();
        }}
        onClick={(event) => {
          event.stopPropagation();
          onClose(tab.id);
        }}
      >
        {tab.dirty
          ? (
            <>
              <span
                className={cn(
                  'size-2 rounded-full bg-(--app-fg) group-hover/close:hidden',
                )}
                aria-hidden
              />
              <X
                className={cn('hidden size-3.5 group-hover/close:block')}
                aria-hidden
              />
            </>
          )
          : <X className={cn('size-3.5')} aria-hidden />}
      </Button>
    </div>
  );
}
