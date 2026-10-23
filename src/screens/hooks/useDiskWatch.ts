import { useEffect, useEffectEvent } from 'react';
import { onDiskFileChanged, syncWatchedFiles } from '../../lib/tauri/fs';
import type { DiskChangeKind } from '../../types/diskFileChanged';

/** 同步监听路径，并把磁盘变更通过回调上报 */
export function useDiskWatch(
  paths: string[],
  onDiskChange: (path: string, kind: DiskChangeKind) => void,
) {
  const reportDiskChange = useEffectEvent((path: string, kind: DiskChangeKind) => {
    onDiskChange(path, kind);
  });

  const watchedPathsKey = paths.join('\0');

  useEffect(() => {
    const nextPaths = watchedPathsKey.length === 0 ? [] : watchedPathsKey.split('\0');
    void syncWatchedFiles(nextPaths);
  }, [watchedPathsKey]);

  useEffect(() => {
    const ready = onDiskFileChanged((payload) => {
      reportDiskChange(payload.path, payload.kind);
    });

    return () => {
      void ready.then((unlisten) => unlisten());
    };
  }, []);
}
