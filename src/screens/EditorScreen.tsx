import { useState } from 'react';
import { MarkdownEditor } from '../editor/MarkdownEditor';
import { MarkdownPreview } from '../preview/MarkdownPreview';
import { cn } from '../utils/cn';

export function EditorScreen() {
  const [source, setSource] = useState('');

  return (
    <div className={cn('grid h-full min-h-0 w-full grid-cols-2')}>
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
  );
}
