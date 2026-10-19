import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { EditorTabBar } from '../components/EditorTabBar';
import { MarkdownEditor } from '../editor/MarkdownEditor';
import {
  confirmDiscardChanges,
  confirmDiscardUnsavedTabs,
  onOpenFilePath,
  onWindowCloseRequested,
  openMarkdownFile,
  openMarkdownPath,
  takePendingOpenPath,
  writeTextFile,
} from '../lib/tauri/fs';
import { MarkdownPreview } from '../preview/MarkdownPreview';
import type { EditorTab } from '../types/editorTab';
import { cn } from '../utils/cn';
import { sameFilePath } from '../utils/sameFilePath';

function fileName(path: string): string {
  const parts = path.split(/[/\\]/);
  return parts.at(-1) || path;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function createTabId(): string {
  return crypto.randomUUID();
}

const toolbarButtonClass = cn(
  'rounded border border-neutral-300 bg-neutral-50 px-3 py-1 text-sm',
  'hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50',
);

export function EditorScreen() {
  /* -------------------------------------------------------------------------- */
  /* State & data */
  /* -------------------------------------------------------------------------- */

  const [tabs, setTabs] = useState<EditorTab[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const tabsRef = useRef(tabs);
  tabsRef.current = tabs;

  const activeTab = tabs.find((tab) => tab.id === activeId) ?? null;
  const source = activeTab?.source ?? '';
  const dirty = activeTab !== null && activeTab.source !== activeTab.savedSource;

  /* -------------------------------------------------------------------------- */
  /* Handlers */
  /* -------------------------------------------------------------------------- */

  function focusOrOpenTab(path: string, content: string) {
    const existing = tabsRef.current.find((tab) => sameFilePath(tab.path, path));
    if (existing) {
      setActiveId(existing.id);
      return;
    }

    const tab: EditorTab = {
      id: createTabId(),
      path,
      source: content,
      savedSource: content,
    };
    setTabs((prev) => [...prev, tab]);
    setActiveId(tab.id);
  }

  async function loadFile(filePath: string) {
    try {
      const existing = tabsRef.current.find((tab) => sameFilePath(tab.path, filePath));
      if (existing) {
        setActiveId(existing.id);
        return;
      }

      const file = await openMarkdownPath(filePath);
      focusOrOpenTab(file.path, file.content);
    } catch (error) {
      toast.error('打开失败', { description: errorMessage(error) });
    }
  }

  async function handleOpen() {
    try {
      const file = await openMarkdownFile();
      if (!file) {
        return;
      }

      focusOrOpenTab(file.path, file.content);
    } catch (error) {
      toast.error('打开失败', { description: errorMessage(error) });
    }
  }

  async function handleSave() {
    if (!activeTab) {
      return;
    }

    try {
      await writeTextFile(activeTab.path, activeTab.source);
      setTabs((prev) =>
        prev.map((tab) => tab.id === activeTab.id ? { ...tab, savedSource: tab.source } : tab)
      );
      toast.success('已保存');
    } catch (error) {
      toast.error('保存失败', { description: errorMessage(error) });
    }
  }

  function handleSourceChange(tabId: string, next: string) {
    setTabs((prev) => prev.map((tab) => (tab.id === tabId ? { ...tab, source: next } : tab)));
  }

  async function handleCloseTab(id: string) {
    const currentTabs = tabsRef.current;
    const tab = currentTabs.find((item) => item.id === id);
    if (!tab) {
      return;
    }

    if (tab.source !== tab.savedSource && !(await confirmDiscardChanges())) {
      return;
    }

    const index = currentTabs.findIndex((item) => item.id === id);
    const next = currentTabs.filter((item) => item.id !== id);
    setTabs(next);
    setActiveId((current) => {
      if (current !== id) {
        return current;
      }
      const neighbor = next[index] ?? next[index - 1] ?? null;
      return neighbor?.id ?? null;
    });
  }

  const handleSaveRef = useRef(handleSave);
  handleSaveRef.current = handleSave;
  const loadFileRef = useRef(loadFile);
  loadFileRef.current = loadFile;

  /* -------------------------------------------------------------------------- */
  /* Effects */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 's') {
        return;
      }
      event.preventDefault();
      void handleSaveRef.current();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

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
        await loadFileRef.current(filePath);
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

  useEffect(() => {
    const ready = (async () => {
      try {
        return await onWindowCloseRequested(async (event) => {
          const dirtyCount = tabsRef.current.filter(
            (tab) => tab.source !== tab.savedSource,
          ).length;
          if (dirtyCount === 0) {
            return;
          }

          const discard = await confirmDiscardUnsavedTabs(dirtyCount);
          if (!discard) {
            event.preventDefault();
          }
        });
      } catch {
        // Browser / non-tauri preview has no window close hook.
        return undefined;
      }
    })();

    return () => {
      void ready.then((unlisten) => unlisten?.());
    };
  }, []);

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
          disabled={!activeTab || !dirty}
          onClick={() => {
            void handleSave();
          }}
        >
          保存
        </button>
        <EditorTabBar
          tabs={tabs.map((tab) => ({
            id: tab.id,
            title: fileName(tab.path),
            dirty: tab.source !== tab.savedSource,
          }))}
          activeId={activeId}
          onSelect={setActiveId}
          onClose={(id) => {
            void handleCloseTab(id);
          }}
        />
      </header>

      <div className={cn('grid min-h-0 flex-1 grid-cols-2')}>
        <section
          className={cn(
            'relative min-h-0 min-w-0 overflow-hidden border-r border-neutral-300 bg-white',
          )}
          aria-label="源码"
        >
          {tabs.length === 0
            ? (
              <p className={cn('p-4 text-sm text-neutral-500')}>
                打开一个 Markdown 文件开始编辑
              </p>
            )
            : tabs.map((tab) => {
              const active = tab.id === activeId;
              return (
                <div
                  key={tab.id}
                  className={cn(
                    'absolute inset-0 min-h-0 overflow-auto',
                    active ? 'z-10' : 'pointer-events-none invisible z-0',
                  )}
                  aria-hidden={!active}
                >
                  <MarkdownEditor
                    value={tab.source}
                    onChange={(next) => {
                      handleSourceChange(tab.id, next);
                    }}
                  />
                </div>
              );
            })}
        </section>
        <section
          className={cn('min-h-0 min-w-0 overflow-auto bg-neutral-50')}
          aria-label="预览"
        >
          {activeTab && <MarkdownPreview source={source} />}
        </section>
      </div>
    </div>
  );
}
