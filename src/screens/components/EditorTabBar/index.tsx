import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers';
import {
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../../utils/cn';
import { SortableEditorTab } from './SortableEditorTab';
import type { EditorTabBarItem } from './types';

export type { EditorTabBarItem } from './types';

type EditorTabBarProps = {
  tabs: EditorTabBarItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  /** 拖拽结束后：被拖动的 id 与落点 id */
  onReorder: (activeId: string, overId: string) => void;
  /** 右侧固定区（如菜单图标） */
  trailing: ReactNode;
};

/** 标签条：可拖拽排序；底色与编辑区区分；选中态与内容区同色；右侧可挂菜单 */
export function EditorTabBar({
  tabs,
  activeId,
  onSelect,
  onClose,
  onReorder,
  trailing,
}: EditorTabBarProps) {
  const { t } = useTranslation();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    onReorder(String(active.id), String(over.id));
  }

  return (
    <div
      className={cn(
        'flex min-h-9 min-w-0 shrink-0 items-stretch bg-(--app-bg-raised) pr-1',
      )}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToHorizontalAxis]}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={tabs.map((tab) => tab.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div
            className={cn('flex min-w-0 flex-1 items-stretch overflow-x-auto')}
            role="tablist"
            aria-label={t('editor.ariaTabList')}
          >
            {tabs.map((tab) => (
              <SortableEditorTab
                key={tab.id}
                tab={tab}
                active={tab.id === activeId}
                onSelect={onSelect}
                onClose={onClose}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {trailing}
    </div>
  );
}
