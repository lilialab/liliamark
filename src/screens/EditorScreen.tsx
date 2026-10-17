import { useState } from 'react';
import { toast } from 'sonner';
import { MarkdownEditor } from '../editor/MarkdownEditor';
import { openMarkdownFile } from '../lib/tauri/fs';
import { MarkdownPreview } from '../preview/MarkdownPreview';
import { cn } from '../utils/cn';

function fileName(path: string): string {
  const parts = path.split(/[/\\]/);
  return parts.at(-1) || path;
}

export function EditorScreen() {
  /* -------------------------------------------------------------------------- */
  /* State & data */
  /* -------------------------------------------------------------------------- */

  const [source, setSource] = useState('');
  const [path, setPath] = useState<string | null>(null);

  /* -------------------------------------------------------------------------- */
  /* Handlers */
  /* -------------------------------------------------------------------------- */

  async function handleOpen() {
    try {
      const file = await openMarkdownFile();
      if (!file) {
        return;
      }
      setPath(file.path);
      setSource(file.content);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error('打开失败', { description: message });
    }
  }

  /* -------------------------------------------------------------------------- */
  /* Render */
  /* -------------------------------------------------------------------------- */

  return (
    <div className={cn('flex h-full min-h-0 w-full flex-col')}>
      <header
        className={cn(
          'flex shrink-0 items-center gap-3 border-b border-neutral-300 bg-white px-3 py-2',
        )}
      >
        <button
          type="button"
          className={cn(
            'rounded border border-neutral-300 bg-neutral-50 px-3 py-1 text-sm',
            'hover:bg-neutral-100',
          )}
          onClick={() => {
            void handleOpen();
          }}
        >
          打开
        </button>
        <p className={cn('min-w-0 truncate text-sm text-neutral-600')}>
          {path ? fileName(path) : '未打开文件'}
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
