import { selectAll } from '@codemirror/commands';
import type { EditorView } from '@codemirror/view';
import { arrayMove } from '@dnd-kit/sortable';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { CodeEditor } from '../editor/CodeEditor';
import { supportsHtmlBrowserOpen, supportsMarkdownPreview } from '../editor/languageRegistry';
import {
  closeCurrentWindow,
  confirmDiscardChanges,
  pickTextFile,
  writeTextFile,
} from '../lib/tauri/fs';
import { openLocalPath } from '../lib/tauri/opener';
import { useAppSettingsStore } from '../stores/appSettingsStore';
import type { DiskChangeKind } from '../types/diskFileChanged';
import type { EditorTab } from '../types/editorTab';
import { cn } from '../utils/cn';
import { resolveActiveTabId } from '../utils/editorSession';
import {
  createTabId,
  updateTab,
  withDiskChange,
  withDiskReload,
  withoutDiskChange,
  withSaved,
} from '../utils/editorTab';
import { fileName, sameFilePath } from '../utils/path';
import { markStartupUiReady } from '../utils/startupTiming';
import { AppMenu } from './components/AppMenu';
import { DiskChangeBanner } from './components/DiskChangeBanner';
import { EditorTabBar } from './components/EditorTabBar';
import { FileDragOverlay } from './components/FileDragOverlay';
import { MarkdownCheatSheetOverlay } from './components/MarkdownCheatSheetOverlay';
import { PreviewOverlay } from './components/PreviewOverlay';
import { SettingsOverlay } from './components/SettingsOverlay';
import { ShortcutsOverlay } from './components/ShortcutsOverlay';
import { StartupTimingOverlay } from './components/StartupTimingOverlay';
import { useBlockBrowserShortcuts } from './hooks/useBlockBrowserShortcuts';
import { useDiskWatch } from './hooks/useDiskWatch';
import { useEditorHotkeys } from './hooks/useEditorHotkeys';
import { useExternalOpenFile } from './hooks/useExternalOpenFile';
import { useFileDragOpen } from './hooks/useFileDragOpen';
import { usePersistEditorSession } from './hooks/usePersistEditorSession';
import { useRestoreEditorSession } from './hooks/useRestoreEditorSession';
import { useUnsavedCloseGuard } from './hooks/useUnsavedCloseGuard';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function EditorScreen() {
  /* -------------------------------------------------------------------------- */
  /* State & data */
  /* -------------------------------------------------------------------------- */

  const [tabs, setTabs] = useState<EditorTab[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSource, setPreviewSource] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [markdownCheatSheetOpen, setMarkdownCheatSheetOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [startupTimingOpen, setStartupTimingOpen] = useState(false);

  const editorViewsRef = useRef(new Map<string, EditorView>());

  useEffect(() => {
    void useAppSettingsStore.getState().hydrate();
  }, []);

  const activeTab = tabs.find((tab) => tab.id === activeId) ?? null;
  const dirty = activeTab?.dirty ?? false;

  function readDoc(tabId: string): string | null {
    return editorViewsRef.current.get(tabId)?.state.doc.toString() ?? null;
  }

  function refreshPreview(tabId: string | null) {
    if (!previewOpen || tabId === null) {
      return;
    }
    const doc = readDoc(tabId);
    if (doc !== null) {
      setPreviewSource(doc);
    }
  }

  function removeTab(tabId: string) {
    editorViewsRef.current.delete(tabId);
    setTabs((prev) => {
      const index = prev.findIndex((item) => item.id === tabId);
      if (index < 0) {
        return prev;
      }
      const next = prev.filter((item) => item.id !== tabId);
      setActiveId((current) => {
        if (current !== tabId) {
          return current;
        }
        const neighbor = next[index] ?? next[index - 1] ?? null;
        return neighbor?.id ?? null;
      });
      return next;
    });
  }

  /* -------------------------------------------------------------------------- */
  /* Handlers */
  /* -------------------------------------------------------------------------- */

  function focusOrOpenTab(path: string) {
    const existing = tabs.find((tab) => sameFilePath(tab.path, path));
    if (existing) {
      setActiveId(existing.id);
      return;
    }

    const tab: EditorTab = {
      id: createTabId(),
      path,
      dirty: false,
      diskChange: null,
      docEpoch: 0,
    };
    setTabs((prev) => [...prev, tab]);
    setActiveId(tab.id);
  }

  async function loadFile(filePath: string) {
    focusOrOpenTab(filePath);
  }

  async function handleOpen() {
    try {
      const path = await pickTextFile();
      if (!path) {
        return;
      }
      focusOrOpenTab(path);
    } catch (error) {
      toast.error('打开失败', { description: errorMessage(error) });
    }
  }

  async function handleSave() {
    if (!activeTab) {
      return;
    }

    const content = readDoc(activeTab.id);
    if (content === null) {
      toast.error('保存失败', { description: '编辑器尚未就绪' });
      return;
    }

    try {
      await writeTextFile(activeTab.path, content);
      setTabs((prev) => updateTab(prev, activeTab.id, withSaved));
    } catch (error) {
      toast.error('保存失败', { description: errorMessage(error) });
    }
  }

  function handleDirty(tabId: string) {
    setTabs((prev) => {
      const tab = prev.find((item) => item.id === tabId);
      if (!tab || tab.dirty) {
        return prev;
      }
      return updateTab(prev, tabId, (item) => ({ ...item, dirty: true }));
    });
    if (tabId === activeId) {
      refreshPreview(tabId);
    }
  }

  function handleEditorReady(tabId: string, editorView: EditorView) {
    editorViewsRef.current.set(tabId, editorView);
    refreshPreview(tabId);
  }

  function handleEditorDestroy(tabId: string) {
    editorViewsRef.current.delete(tabId);
  }

  function handleLoadError(tabId: string, error: unknown) {
    toast.error('打开失败', { description: errorMessage(error) });
    removeTab(tabId);
  }

  function handlePathResolved(tabId: string, path: string) {
    setTabs((prev) => updateTab(prev, tabId, (tab) => ({ ...tab, path })));
  }

  function handleKeepEdits(id: string) {
    setTabs((prev) => updateTab(prev, id, withoutDiskChange));
  }

  function handleReloadFromDisk(id: string) {
    const tab = tabs.find((item) => item.id === id);
    if (!tab || tab.diskChange !== 'modify') {
      return;
    }
    setTabs((prev) => updateTab(prev, id, withDiskReload));
  }

  async function handleCloseTab(id: string) {
    const tab = tabs.find((item) => item.id === id);
    if (!tab) {
      return;
    }

    if (tab.dirty && !(await confirmDiscardChanges())) {
      return;
    }

    removeTab(id);
  }

  function handleTogglePreview() {
    if (!previewOpen && activeId !== null) {
      setPreviewSource(readDoc(activeId) ?? '');
    }
    setPreviewOpen((open) => !open);
  }

  async function handleOpenHtmlInBrowser() {
    if (!activeTab) {
      toast.error('无法打开', { description: '文件路径无效' });
      return;
    }
    const ok = await openLocalPath(activeTab.path);
    if (!ok) {
      toast.error('打开失败', { description: '系统未能用默认应用打开该文件' });
    }
  }

  function applyRestoredSession(restored: EditorTab[], activePath: string | null) {
    setTabs(restored);
    setActiveId(resolveActiveTabId(restored, activePath));
  }

  function handleDiskChange(path: string, kind: DiskChangeKind) {
    setTabs((prev) => withDiskChange(prev, path, kind));
  }

  function getDirtyTabCount() {
    return tabs.filter((tab) => tab.dirty).length;
  }

  function handleCloseTabHotkey() {
    if (activeId === null) {
      return;
    }
    void handleCloseTab(activeId);
  }

  function handleCloseWindowHotkey() {
    void closeCurrentWindow();
  }

  function handleSelectAllInEditor() {
    if (activeId === null) {
      return;
    }
    const editorView = editorViewsRef.current.get(activeId);
    if (!editorView) {
      return;
    }
    editorView.focus();
    selectAll(editorView);
  }

  function handleReorderTabs(draggedId: string, overId: string) {
    setTabs((prev) => {
      const from = prev.findIndex((tab) => tab.id === draggedId);
      const to = prev.findIndex((tab) => tab.id === overId);
      return arrayMove(prev, from, to);
    });
  }

  /* -------------------------------------------------------------------------- */
  /* Effects */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    markStartupUiReady();
  }, []);

  useEffect(() => {
    if (!previewOpen || activeId === null) {
      return;
    }
    const doc = editorViewsRef.current.get(activeId)?.state.doc.toString();
    if (doc !== undefined) {
      setPreviewSource(doc);
    }
  }, [activeId, previewOpen]);

  const fileDragActive = useFileDragOpen(loadFile);
  const sessionReady = useRestoreEditorSession(applyRestoredSession);
  useExternalOpenFile(loadFile, sessionReady);
  usePersistEditorSession(tabs, activeId);
  useDiskWatch(
    tabs.map((tab) => tab.path),
    handleDiskChange,
  );
  useUnsavedCloseGuard(getDirtyTabCount);
  useBlockBrowserShortcuts();
  useEditorHotkeys({
    onSave: handleSave,
    onTogglePreview: handleTogglePreview,
    onCloseTab: handleCloseTabHotkey,
    onCloseWindow: handleCloseWindowHotkey,
    onSelectAllInEditor: handleSelectAllInEditor,
  });

  /* -------------------------------------------------------------------------- */
  /* Render */
  /* -------------------------------------------------------------------------- */

  return (
    <div className={cn('relative flex h-full min-h-0 w-full flex-col')}>
      <FileDragOverlay active={fileDragActive} />
      <EditorTabBar
        tabs={tabs.map((tab) => ({
          id: tab.id,
          title: fileName(tab.path),
          dirty: tab.dirty,
          diskChange: tab.diskChange !== null,
        }))}
        activeId={activeId}
        onSelect={setActiveId}
        onClose={(id) => {
          void handleCloseTab(id);
        }}
        onReorder={handleReorderTabs}
        trailing={
          <AppMenu
            items={[
              {
                id: 'open',
                label: '打开',
                onSelect: () => {
                  void handleOpen();
                },
              },
              {
                id: 'settings',
                label: '设置',
                onSelect: () => {
                  setSettingsOpen(true);
                },
              },
              {
                id: 'markdown-cheat-sheet',
                label: 'Markdown 标记',
                onSelect: () => {
                  setMarkdownCheatSheetOpen(true);
                },
              },
              {
                id: 'shortcuts',
                label: '快捷键',
                onSelect: () => {
                  setShortcutsOpen(true);
                },
              },
              {
                id: 'startup-timing',
                label: '启动耗时',
                onSelect: () => {
                  setStartupTimingOpen(true);
                },
              },
            ]}
          />
        }
      />

      {activeTab && (
        <DiskChangeBanner
          diskChange={activeTab.diskChange}
          dirty={dirty}
          onReload={() => {
            handleReloadFromDisk(activeTab.id);
          }}
          onKeepEdits={() => {
            handleKeepEdits(activeTab.id);
          }}
        />
      )}

      <section
        className={cn('relative min-h-0 min-w-0 flex-1 overflow-hidden bg-(--app-bg)')}
        aria-label="源码"
      >
        {tabs.length === 0
          ? (
            <p className={cn('p-4 text-sm text-(--app-muted)')}>
              打开一个文件开始编辑（Ctrl+S 保存 · Ctrl+E 切换预览）
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
                <CodeEditor
                  key={tab.docEpoch}
                  path={tab.path}
                  onDirty={() => {
                    handleDirty(tab.id);
                  }}
                  onReady={(editorView) => {
                    handleEditorReady(tab.id, editorView);
                  }}
                  onDestroy={() => {
                    handleEditorDestroy(tab.id);
                  }}
                  onLoadError={(error) => {
                    handleLoadError(tab.id, error);
                  }}
                  onPathResolved={(path) => {
                    handlePathResolved(tab.id, path);
                  }}
                />
              </div>
            );
          })}
        <PreviewOverlay
          open={previewOpen}
          markdownPreview={activeTab !== null && supportsMarkdownPreview(activeTab.path)}
          htmlBrowserOpen={activeTab !== null && supportsHtmlBrowserOpen(activeTab.path)}
          source={previewSource}
          onOpenInBrowser={handleOpenHtmlInBrowser}
        />
        <SettingsOverlay
          open={settingsOpen}
          onClose={() => {
            setSettingsOpen(false);
          }}
        />
        <MarkdownCheatSheetOverlay
          open={markdownCheatSheetOpen}
          onClose={() => {
            setMarkdownCheatSheetOpen(false);
          }}
        />
        <ShortcutsOverlay
          open={shortcutsOpen}
          onClose={() => {
            setShortcutsOpen(false);
          }}
        />
        <StartupTimingOverlay
          open={startupTimingOpen}
          onClose={() => {
            setStartupTimingOpen(false);
          }}
        />
      </section>
    </div>
  );
}
