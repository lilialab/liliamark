import type { DiskChangeKind } from '../../types/diskFileChanged';
import { cn } from '../../utils/cn';

type DiskChangeBannerProps = {
  diskChange: DiskChangeKind | null;
  dirty: boolean;
  onReload: () => void;
  onKeepEdits: () => void;
};

const bannerClass = cn(
  'flex shrink-0 items-center gap-3 border-b border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950',
);

const actionButtonClass = cn(
  'rounded border border-neutral-300 bg-neutral-50 px-3 py-1 text-sm',
  'hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50',
);

export function DiskChangeBanner({
  diskChange,
  dirty,
  onReload,
  onKeepEdits,
}: DiskChangeBannerProps) {
  if (diskChange === 'remove') {
    return (
      <div className={bannerClass}>
        <p className={cn('min-w-0 flex-1')}>文件已删除或移走</p>
      </div>
    );
  }

  if (diskChange === 'modify' && !dirty) {
    return (
      <div className={bannerClass}>
        <p className={cn('min-w-0 flex-1')}>磁盘上的文件已更新</p>
        <button type="button" className={actionButtonClass} onClick={onReload}>
          重载
        </button>
      </div>
    );
  }

  if (diskChange === 'modify' && dirty) {
    return (
      <div className={bannerClass}>
        <p className={cn('min-w-0 flex-1')}>磁盘上的文件已更新，与当前未保存的修改冲突</p>
        <button type="button" className={actionButtonClass} onClick={onKeepEdits}>
          保留编辑
        </button>
        <button type="button" className={actionButtonClass} onClick={onReload}>
          用磁盘版本
        </button>
      </div>
    );
  }

  return null;
}
