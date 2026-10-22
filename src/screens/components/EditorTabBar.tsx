import type { ReactNode } from 'react';
import { Button } from '../../components/Button';
import { cn } from '../../utils/cn';

export type EditorTabBarItem = {
  id: string;
  title: string;
  dirty: boolean;
  /** 非当前 tab 的磁盘变更标记；当前 tab 的说明在横幅上 */
  diskChange: boolean;
};

type EditorTabBarProps = {
  tabs: EditorTabBarItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  /** 右侧固定区（如菜单图标） */
  trailing: ReactNode;
};

/** 标签条：底色与编辑区区分；选中态与内容区同色；右侧可挂菜单 */
export function EditorTabBar({
  tabs,
  activeId,
  onSelect,
  onClose,
  trailing,
}: EditorTabBarProps) {
  return (
    <div
      className={cn(
        'flex min-h-9 min-w-0 shrink-0 items-stretch bg-(--app-bg-raised) pr-1',
      )}
    >
      <div
        className={cn('flex min-w-0 flex-1 items-stretch overflow-x-auto')}
        role="tablist"
        aria-label="已打开文件"
      >
        {tabs.map((tab, index) => {
          const active = tab.id === activeId;
          const prevActive = index > 0 && tabs[index - 1]?.id === activeId;
          // 贴着选中 tab 的分割线与选中底同色，会像多出一块，故只画在两个未选中之间
          const showDivider = index > 0 && !active && !prevActive;
          return (
            <div
              key={tab.id}
              role="tab"
              aria-selected={active}
              className={cn(
                'group relative flex max-w-48 shrink-0 items-center gap-1.5 px-3 text-sm',
                active
                  ? 'bg-(--app-bg) text-(--app-fg)'
                  : 'bg-transparent text-(--app-muted) hover:bg-(--app-surface)',
              )}
            >
              {showDivider && (
                <span
                  className={cn(
                    'pointer-events-none absolute top-1/2 left-0 h-3.5 w-px -translate-y-1/2',
                    'bg-(--app-bg)',
                  )}
                  aria-hidden
                />
              )}
              <Button
                variant="ghost"
                className={cn(
                  'flex min-w-0 flex-1 items-center gap-1.5 py-1.5 text-left text-(--app-fg)',
                  !active && 'text-(--app-muted)',
                )}
                onClick={() => {
                  onSelect(tab.id);
                }}
              >
                <span className={cn('min-w-0 truncate')}>{tab.title}</span>
                {tab.diskChange && (
                  <span className={cn('shrink-0 text-(--app-warn-fg)')} title="磁盘已变更">
                    !
                  </span>
                )}
              </Button>
              <Button
                variant="ghost"
                className={cn(
                  'group/close flex size-5 shrink-0 items-center justify-center',
                  active || tab.dirty ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                )}
                aria-label={`关闭 ${tab.title}`}
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
                      <span className={cn('hidden group-hover/close:inline')} aria-hidden>
                        ×
                      </span>
                    </>
                  )
                  : <span aria-hidden>×</span>}
              </Button>
            </div>
          );
        })}
      </div>
      {trailing}
    </div>
  );
}
