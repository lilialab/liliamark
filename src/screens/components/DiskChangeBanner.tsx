import { Button } from '../../components/Button';
import type { DiskChangeKind } from '../../types/diskFileChanged';
import { cn } from '../../utils/cn';

type DiskChangeBannerProps = {
  diskChange: DiskChangeKind | null;
  dirty: boolean;
  onReload: () => void;
  onKeepEdits: () => void;
};

const bannerClass = cn(
  'flex shrink-0 items-center gap-3 border-b border-(--app-warn-border) bg-(--app-warn-bg) px-3 py-2 text-sm text-(--app-warn-fg)',
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
        <Button onClick={onReload}>重载</Button>
      </div>
    );
  }

  if (diskChange === 'modify' && dirty) {
    return (
      <div className={bannerClass}>
        <p className={cn('min-w-0 flex-1')}>磁盘上的文件已更新，与当前未保存的修改冲突</p>
        <Button onClick={onKeepEdits}>保留编辑</Button>
        <Button onClick={onReload}>用磁盘版本</Button>
      </div>
    );
  }

  return null;
}
