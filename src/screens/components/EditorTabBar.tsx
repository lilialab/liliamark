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
};

export function EditorTabBar({ tabs, activeId, onSelect, onClose }: EditorTabBarProps) {
  if (tabs.length === 0) {
    return null;
  }

  return (
    <div
      className={cn('flex min-w-0 flex-1 items-center gap-1 overflow-x-auto')}
      role="tablist"
      aria-label="已打开文件"
    >
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        return (
          <div
            key={tab.id}
            role="tab"
            aria-selected={active}
            className={cn(
              'flex max-w-48 shrink-0 items-center gap-1 rounded border px-2 py-1 text-sm',
              active
                ? 'border-(--app-border) bg-(--app-surface) text-(--app-fg)'
                : 'border-transparent bg-(--app-bg) text-(--app-muted) hover:bg-(--app-surface-hover)',
            )}
          >
            <button
              type="button"
              className={cn('min-w-0 truncate text-left')}
              onClick={() => {
                onSelect(tab.id);
              }}
            >
              {tab.title}
              {tab.dirty ? ' •' : ''}
              {tab.diskChange ? ' !' : ''}
            </button>
            <button
              type="button"
              className={cn(
                'rounded px-1 text-(--app-muted) hover:bg-(--app-surface-hover) hover:text-(--app-fg)',
              )}
              aria-label={`关闭 ${tab.title}`}
              onClick={(event) => {
                event.stopPropagation();
                onClose(tab.id);
              }}
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
