import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { supportsMarkdownPreview } from '../editor/languageRegistry';
import { MarkdownEditor } from '../editor/MarkdownEditor';
import {
  closeCurrentWindow,
  confirmDiscardChanges,
  openMarkdownFile,
  openMarkdownPath,
  writeTextFile,
} from '../lib/tauri/fs';
import type { EditorTab } from '../types/editorTab';
import { cn } from '../utils/cn';
import {
  createTabId,
  updateTab,
  withDiskChange,
  withDiskContent,
  withoutDiskChange,
  withSavedSource,
} from '../utils/editorTab';
import { fileName, sameFilePath } from '../utils/path';
import { DiskChangeBanner } from './components/DiskChangeBanner';
import { EditorTabBar } from './components/EditorTabBar';
import { FileDragOverlay } from './components/FileDragOverlay';
import { PreviewOverlay } from './components/PreviewOverlay';
import { useDiskWatch } from './hooks/useDiskWatch';
import { useEditorHotkeys } from './hooks/useEditorHotkeys';
import { useExternalOpenFile } from './hooks/useExternalOpenFile';
import { useFileDragOpen } from './hooks/useFileDragOpen';
import { useUnsavedCloseGuard } from './hooks/useUnsavedCloseGuard';

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

  const [tabs, setTabs] = useState<EditorTab[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
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
      setTabs((prev) => updateTab(prev, id, (item) => withDiskContent(item, file.content)));
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

  function handleTogglePreview() {
    setPreviewOpen((open) => !open);
  }

  /* -------------------------------------------------------------------------- */
  /* Effects */
  /* -------------------------------------------------------------------------- */

  const fileDragActive = useFileDragOpen(loadFile);
  useExternalOpenFile(loadFile);
  useDiskWatch(
    tabs.map((tab) => tab.path),
    (path, kind) => {
      setTabs((prev) => withDiskChange(prev, path, kind));
    },
  );
  useUnsavedCloseGuard(
    () => tabs.filter((tab) => tab.source !== tab.savedSource).length,
  );
  useEditorHotkeys({
    onSave: handleSave,
    onTogglePreview: handleTogglePreview,
    onCloseTab: () => {
      if (activeId !== null) {
        void handleCloseTab(activeId);
        return;
      }
      void closeCurrentWindow();
    },
  });

  /* -------------------------------------------------------------------------- */
  /* Render */
  /* -------------------------------------------------------------------------- */

  return (
    <div className={cn('relative flex h-full min-h-0 w-full flex-col')}>
      <FileDragOverlay active={fileDragActive} />
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

      {activeTab && (
        <DiskChangeBanner
          diskChange={activeTab.diskChange}
          dirty={dirty}
          onReload={() => {
            void handleReloadFromDisk(activeTab.id);
          }}
          onKeepEdits={() => {
            handleKeepEdits(activeTab.id);
          }}
        />
      )}

      <section
        className={cn('relative min-h-0 min-w-0 flex-1 overflow-hidden bg-white')}
        aria-label="源码"
      >
        {tabs.length === 0
          ? (
            <p className={cn('p-4 text-sm text-neutral-500')}>
              打开一个文件开始编辑（Ctrl+E 切换预览）
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
                  path={tab.path}
                  value={tab.source}
                  onChange={(next) => {
                    handleSourceChange(tab.id, next);
                  }}
                />
              </div>
            );
          })}
        <PreviewOverlay
          open={previewOpen}
          supportsPreview={activeTab !== null && supportsMarkdownPreview(activeTab.path)}
          source={source}
        />
      </section>
    </div>
  );
}
