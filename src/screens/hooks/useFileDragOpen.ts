import { useEffect, useEffectEvent, useState } from 'react';
import { toast } from 'sonner';
import { classifyDropPaths, onDragDrop } from '../../lib/tauri/fs';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** 拖入文件打开；返回是否显示「松开以打开」遮罩 */
export function useFileDragOpen(loadFile: (path: string) => Promise<void>): boolean {
  const [fileDragActive, setFileDragActive] = useState(false);

  const openPath = useEffectEvent(async (path: string) => {
    await loadFile(path);
  });

  useEffect(() => {
    let cancelled = false;

    async function handleDrop(paths: string[]) {
      try {
        const { files, hadDirectory } = await classifyDropPaths(paths);
        if (cancelled) {
          return;
        }
        if (hadDirectory) {
          toast.message('请拖入文件');
        }
        for (const path of files) {
          if (cancelled) {
            return;
          }
          await openPath(path);
        }
      } catch (error) {
        if (!cancelled) {
          toast.error('打开失败', { description: errorMessage(error) });
        }
      }
    }

    const ready = onDragDrop((event) => {
      if (cancelled) {
        return;
      }

      if (event.type === 'enter') {
        setFileDragActive(true);
        return;
      }

      if (event.type === 'leave') {
        setFileDragActive(false);
        return;
      }

      if (event.type !== 'drop') {
        return;
      }

      setFileDragActive(false);
      void handleDrop(event.paths);
    });

    return () => {
      cancelled = true;
      void ready.then((unlisten) => unlisten());
    };
  }, []);

  return fileDragActive;
}
