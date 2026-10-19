import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { MarkdownEditor } from '../editor/MarkdownEditor';
import {
  confirmDiscardChanges,
  onOpenFilePath,
  openMarkdownFile,
  openMarkdownPath,
  takePendingOpenPath,
  writeTextFile,
} from '../lib/tauri/fs';
import { MarkdownPreview } from '../preview/MarkdownPreview';
import { cn } from '../utils/cn';

function fileName(path: string): string {
  const parts = path.split(/[/\\]/);
  return parts.at(-1) || path;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

const toolbarButtonClass = cn(
  'rounded border border-neutral-300 bg-neutral-50 px-3 py-1 text-sm',
  'hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50',
);

export function EditorScreen() {
  /* -------------------------------------------------------------------------- */
  /* State & data */
  /* -------------------------------------------------------------------------- */

  const [source, setSource] = useState('');
  const [savedSource, setSavedSource] = useState('');
  const [path, setPath] = useState<string | null>(null);
  const dirty = source !== savedSource;
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  /* -------------------------------------------------------------------------- */
  /* Handlers */
  /* -------------------------------------------------------------------------- */

  async function loadFile(filePath: string) {
    try {
      if (dirtyRef.current && !(await confirmDiscardChanges())) {
        return;
      }

      const file = await openMarkdownPath(filePath);
      setPath(file.path);
      setSource(file.content);
      setSavedSource(file.content);
    } catch (error) {
      toast.error('打开失败', { description: errorMessage(error) });
    }
  }

  async function handleOpen() {
    try {
      if (dirty && !(await confirmDiscardChanges())) {
        return;
      }

      const file = await openMarkdownFile();
      if (!file) {
        return;
      }

      setPath(file.path);
      setSource(file.content);
      setSavedSource(file.content);
    } catch (error) {
      toast.error('打开失败', { description: errorMessage(error) });
    }
  }

  async function handleSave() {
    if (!path) {
      return;
    }

    try {
      await writeTextFile(path, source);
      setSavedSource(source);
      toast.success('已保存');
    } catch (error) {
      toast.error('保存失败', { description: errorMessage(error) });
    }
  }

  /* -------------------------------------------------------------------------- */
  /* Effects */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 's') {
        return;
      }
      event.preventDefault();
      void handleSave();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [path, source]);

  useEffect(() => {
    let cancelled = false;
    let lastPath: string | null = null;
    let lastAt = 0;

    async function openExternalPath(filePath: string) {
      const now = Date.now();
      if (lastPath === filePath && now - lastAt < 500) {
        return;
      }
      lastPath = filePath;
      lastAt = now;
      if (!cancelled) {
        await loadFile(filePath);
      }
    }

    const ready = (async () => {
      const unlisten = await onOpenFilePath((filePath) => {
        void openExternalPath(filePath);
      });

      try {
        const pending = await takePendingOpenPath();
        if (pending && !cancelled) {
          await openExternalPath(pending);
        }
      } catch {
        // Browser / non-tauri preview has no launch path command.
      }

      return unlisten;
    })();

    return () => {
      cancelled = true;
      void ready.then((unlisten) => unlisten());
    };
  }, []);

  /* -------------------------------------------------------------------------- */
  /* Render */
  /* -------------------------------------------------------------------------- */

  const title = path ? fileName(path) : '未命名';

  return (
    <div className={cn('flex h-full min-h-0 w-full flex-col')}>
      <header
        className={cn(
          'flex shrink-0 items-center gap-3 border-b border-neutral-300 bg-white px-3 py-2',
        )}
      >
        <button
          type="button"
          className={toolbarButtonClass}
          onClick={() => {
            void handleOpen();
          }}
        >
          打开
        </button>
        <button
          type="button"
          className={toolbarButtonClass}
          disabled={!path || !dirty}
          onClick={() => {
            void handleSave();
          }}
        >
          保存
        </button>
        <p className={cn('min-w-0 truncate text-sm text-neutral-600')}>
          {title}
          {dirty ? ' •' : ''}
        </p>
      </header>

      <div className={cn('grid min-h-0 flex-1 grid-cols-2')}>
        <section
          className={cn('min-h-0 min-w-0 overflow-auto border-r border-neutral-300 bg-white')}
          aria-label="源码"
        >
          <MarkdownEditor value={source} onChange={setSource} />
        </section>
        <section
          className={cn('min-h-0 min-w-0 overflow-auto bg-neutral-50')}
          aria-label="预览"
        >
          <MarkdownPreview source={source} />
        </section>
      </div>
    </div>
  );
}
