import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { EditorTabBar } from '../components/EditorTabBar';
import { MarkdownEditor } from '../editor/MarkdownEditor';
import {
  classifyDropPaths,
  confirmDiscardChanges,
  confirmDiscardUnsavedTabs,
  onDiskFileChanged,
  onDragDrop,
  onOpenFilePath,
  onWindowCloseRequested,
  openMarkdownFile,
  openMarkdownPath,
  syncWatchedFiles,
  takePendingOpenPath,
  writeTextFile,
} from '../lib/tauri/fs';
import { MarkdownPreview } from '../preview/MarkdownPreview';
import type { DiskChangeKind } from '../types/diskFileChanged';
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

function updateTab(
  tabs: EditorTab[],
  id: string,
  update: (tab: EditorTab) => EditorTab,
): EditorTab[] {
  return tabs.map((tab) => (tab.id === id ? update(tab) : tab));
}

function withSavedSource(tab: EditorTab): EditorTab {
  return { ...tab, savedSource: tab.source };
}

function withDiskContent(tab: EditorTab, content: string): EditorTab {
  return {
    ...tab,
    source: content,
    savedSource: content,
    diskChange: null,
    docEpoch: tab.docEpoch + 1,
  };
}

function withoutDiskChange(tab: EditorTab): EditorTab {
  return { ...tab, diskChange: null };
}

function withDiskChange(tabs: EditorTab[], path: string, kind: DiskChangeKind): EditorTab[] {
  return tabs.map((tab) => (sameFilePath(tab.path, path) ? { ...tab, diskChange: kind } : tab));
}

const diskBannerClass = cn(
  'flex shrink-0 items-center gap-3 border-b border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950',
);

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
  const [fileDragActive, setFileDragActive] = useState(false);
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
      diskChange: null,
      docEpoch: 0,
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
      setTabs((prev) => updateTab(prev, activeTab.id, withSavedSource));
      toast.success('已保存');
    } catch (error) {
      toast.error('保存失败', { description: errorMessage(error) });
    }
  }

  function handleSourceChange(tabId: string, next: string) {
    setTabs((prev) => updateTab(prev, tabId, (tab) => ({ ...tab, source: next })));
  }

  function handleKeepEdits(id: string) {
    setTabs((prev) => updateTab(prev, id, withoutDiskChange));
  }

  async function handleReloadFromDisk(id: string) {
    const tab = tabsRef.current.find((item) => item.id === id);
    if (!tab || tab.diskChange !== 'modify') {
      return;
    }

    try {
      const file = await openMarkdownPath(tab.path);
      setTabs((prev) => updateTab(prev, id, (tab) => withDiskContent(tab, file.content)));
    } catch (error) {
      toast.error('重载失败', { description: errorMessage(error) });
    }
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

  const watchedPathsKey = tabs.map((tab) => tab.path).join('\0');

  useEffect(() => {
    const paths = watchedPathsKey.length === 0 ? [] : watchedPathsKey.split('\0');
    void syncWatchedFiles(paths).catch(() => {
      // Browser / non-tauri preview has no watch command.
    });
  }, [watchedPathsKey]);

  useEffect(() => {
    const ready = (async () => {
      try {
        return await onDiskFileChanged((payload) => {
          setTabs((prev) => withDiskChange(prev, payload.path, payload.kind));
        });
      } catch {
        return undefined;
      }
    })();

    return () => {
      void ready.then((unlisten) => unlisten?.());
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const ready = (async () => {
      try {
        return await onDragDrop((event) => {
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

          void (async () => {
            try {
              const { files, hadDirectory } = await classifyDropPaths(event.paths);
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
                await loadFileRef.current(path);
              }
            } catch (error) {
              if (!cancelled) {
                toast.error('打开失败', { description: errorMessage(error) });
              }
            }
          })();
        });
      } catch {
        return undefined;
      }
    })();

    return () => {
      cancelled = true;
      void ready.then((unlisten) => unlisten?.());
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
    <div className={cn('relative flex h-full min-h-0 w-full flex-col')}>
      {fileDragActive && (
        <div
          className={cn(
            'pointer-events-none absolute inset-0 z-50 flex items-center justify-center',
            'bg-neutral-900/25',
          )}
          aria-live="polite"
        >
          <p
            className={cn(
              'rounded-md bg-white/95 px-5 py-2.5 text-sm text-neutral-900',
            )}
          >
            松开以打开
          </p>
        </div>
      )}
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
            diskChange: tab.diskChange !== null,
          }))}
          activeId={activeId}
          onSelect={setActiveId}
          onClose={(id) => {
            void handleCloseTab(id);
          }}
        />
      </header>

      {activeTab?.diskChange === 'modify' && !dirty && (
        <div className={diskBannerClass}>
          <p className={cn('min-w-0 flex-1')}>磁盘上的文件已更新</p>
          <button
            type="button"
            className={toolbarButtonClass}
            onClick={() => {
              void handleReloadFromDisk(activeTab.id);
            }}
          >
            重载
          </button>
        </div>
      )}
      {activeTab?.diskChange === 'remove' && (
        <div className={diskBannerClass}>
          <p className={cn('min-w-0 flex-1')}>文件已删除或移走</p>
        </div>
      )}
      {activeTab?.diskChange === 'modify' && dirty && (
        <div className={diskBannerClass}>
          <p className={cn('min-w-0 flex-1')}>磁盘上的文件已更新，与当前未保存的修改冲突</p>
          <button
            type="button"
            className={toolbarButtonClass}
            onClick={() => {
              handleKeepEdits(activeTab.id);
            }}
          >
            保留编辑
          </button>
          <button
            type="button"
            className={toolbarButtonClass}
            onClick={() => {
              void handleReloadFromDisk(activeTab.id);
            }}
          >
            用磁盘版本
          </button>
        </div>
      )}

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
                    key={tab.docEpoch}
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
