import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

  if (diskChange === 'remove') {
    return (
      <div className={bannerClass}>
        <p className={cn('min-w-0 flex-1')}>{t('disk.removed')}</p>
      </div>
    );
  }

  if (diskChange === 'modify' && !dirty) {
    return (
      <div className={bannerClass}>
        <p className={cn('min-w-0 flex-1')}>{t('disk.updated')}</p>
        <Button onClick={onReload}>{t('disk.reload')}</Button>
      </div>
    );
  }

  if (diskChange === 'modify' && dirty) {
    return (
      <div className={bannerClass}>
        <p className={cn('min-w-0 flex-1')}>{t('disk.conflict')}</p>
        <Button onClick={onKeepEdits}>{t('disk.keepEdits')}</Button>
        <Button onClick={onReload}>{t('disk.useDisk')}</Button>
      </div>
    );
  }

  return null;
}
