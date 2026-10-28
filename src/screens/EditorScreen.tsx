import { selectAll } from '@codemirror/commands';
import type { EditorView } from '@codemirror/view';
import { arrayMove } from '@dnd-kit/sortable';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { CodeEditor } from '../editor/CodeEditor';
import {
  closeCurrentWindow,
  confirmDiscardChanges,
  pickSaveTextFile,
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
import { DEFAULT_UNTITLED_EXT, tabLanguagePath } from '../utils/untitled';
import { AppMenu } from './components/AppMenu';
import { DiskChangeBanner } from './components/DiskChangeBanner';
import { EditorTabBar } from './components/EditorTabBar';
import { FileDragOverlay } from './components/FileDragOverlay';
import { MarkdownCheatSheetOverlay } from './components/MarkdownCheatSheetOverlay';
import { PreviewOverlay } from './components/PreviewOverlay';
import { SettingsOverlay } from './components/SettingsOverlay';
import { ShortcutsOverlay } from './components/ShortcutsOverlay';
import { StartupTimingOverlay } from './components/StartupTimingOverlay';
import { UntitledExtPicker } from './components/UntitledExtPicker';
import { modifierKeyLabel } from './help/editorHotkeyHints';
import { useAutoSaveOnBlur } from './hooks/useAutoSaveOnBlur';
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

  const { t } = useTranslation();
  const [tabs, setTabs] = useState<EditorTab[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSource, setPreviewSource] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [markdownCheatSheetOpen, setMarkdownCheatSheetOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [startupTimingOpen, setStartupTimingOpen] = useState(false);

  const editorViewsRef = useRef(new Map<string, EditorView>());
  const tabsRef = useRef(tabs);
  tabsRef.current = tabs;

  useEffect(() => {
    void useAppSettingsStore.getState().hydrate();
  }, []);

  const activeTab = tabs.find((tab) => tab.id === activeId) ?? null;
  const dirty = activeTab?.dirty ?? false;
  const modKey = modifierKeyLabel();

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
    const existing = tabs.find((tab) => tab.path !== null && sameFilePath(tab.path, path));
    if (existing) {
      setActiveId(existing.id);
      return;
    }

    const tab: EditorTab = {
      id: createTabId(),
      path,
      untitledExt: DEFAULT_UNTITLED_EXT,
      dirty: false,
      diskChange: null,
      docEpoch: 0,
    };
    setTabs((prev) => [...prev, tab]);
    setActiveId(tab.id);
  }

  function handleNew() {
    const tab: EditorTab = {
      id: createTabId(),
      path: null,
      untitledExt: DEFAULT_UNTITLED_EXT,
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
      toast.error(t('toast.openFailed'), { description: errorMessage(error) });
    }
  }

  /** 保存指定已落盘标签；写盘期间若正文又变了则保持 dirty */
  async function saveTab(tabId: string, options?: { requireReadyToast?: boolean }) {
    const tab = tabsRef.current.find((item) => item.id === tabId);
    if (!tab?.dirty || tab.path === null) {
      return;
    }

    const content = readDoc(tabId);
    if (content === null) {
      if (options?.requireReadyToast) {
        toast.error(t('toast.saveFailed'), { description: t('toast.editorNotReady') });
      }
      return;
    }

    try {
      await writeTextFile(tab.path, content);
      setTabs((prev) => {
        const latest = readDoc(tabId);
        if (latest !== null && latest !== content) {
          return prev;
        }
        return updateTab(prev, tabId, withSaved);
      });
    } catch (error) {
      toast.error(t('toast.saveFailed'), { description: errorMessage(error) });
    }
  }

  /** 另存为：选路径写入；当前标签切到新路径（未命名即晋升） */
  async function saveTabAs(tabId: string) {
    const tab = tabsRef.current.find((item) => item.id === tabId);
    if (!tab) {
      return;
    }

    const content = readDoc(tabId);
    if (content === null) {
      toast.error(t('toast.saveFailed'), { description: t('toast.editorNotReady') });
      return;
    }

    try {
      const defaultName = tab.path === null
        ? `${t('editor.untitled')}.${tab.untitledExt}`
        : fileName(tab.path);
      const path = await pickSaveTextFile(defaultName);
      if (!path) {
        return;
      }

      await writeTextFile(path, content);
      setTabs((prev) => {
        const latest = readDoc(tabId);
        if (latest !== null && latest !== content) {
          return updateTab(prev, tabId, (item) => ({ ...item, path }));
        }
        return updateTab(prev, tabId, (item) => withSaved({ ...item, path }));
      });
    } catch (error) {
      toast.error(t('toast.saveFailed'), { description: errorMessage(error) });
    }
  }

  async function saveDirtyTabs() {
    const dirtyIds = tabsRef.current
      .filter((tab) => tab.dirty && tab.path !== null)
      .map((tab) => tab.id);
    for (const id of dirtyIds) {
      await saveTab(id);
    }
  }

  async function handleSave() {
    if (!activeId) {
      return;
    }
    const tab = tabsRef.current.find((item) => item.id === activeId);
    if (!tab) {
      return;
    }
    if (tab.path === null) {
      await saveTabAs(activeId);
      return;
    }
    await saveTab(activeId, { requireReadyToast: true });
  }

  async function handleSaveAs() {
    if (!activeId) {
      return;
    }
    await saveTabAs(activeId);
  }

  function handleUntitledExtChange(tabId: string, ext: string) {
    setTabs((prev) =>
      updateTab(prev, tabId, (tab) => tab.path === null ? { ...tab, untitledExt: ext } : tab)
    );
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

  function handleEditorBlur(tabId: string) {
    const current = tabsRef.current.find((item) => item.id === tabId);
    if (current?.path !== null) {
      void saveTab(tabId);
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
    toast.error(t('toast.openFailed'), { description: errorMessage(error) });
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
    if (activeId === null) {
      return;
    }
    if (!previewOpen) {
      setPreviewSource(readDoc(activeId) ?? '');
    }
    setPreviewOpen((open) => !open);
  }

  async function handleOpenHtmlInBrowser() {
    if (!activeTab?.path) {
      toast.error(t('toast.cannotOpen'), { description: t('toast.invalidPath') });
      return;
    }
    const ok = await openLocalPath(activeTab.path);
    if (!ok) {
      toast.error(t('toast.openFailed'), { description: t('toast.openWithSystemFailed') });
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
    if (activeId === null) {
      setPreviewOpen(false);
      return;
    }
    if (!previewOpen) {
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
    tabs.map((tab) => tab.path).filter((path): path is string => path !== null),
    handleDiskChange,
  );
  useUnsavedCloseGuard(getDirtyTabCount);
  useAutoSaveOnBlur(saveDirtyTabs);
  useBlockBrowserShortcuts();
  useEditorHotkeys({
    onNew: handleNew,
    onSave: handleSave,
    onSaveAs: handleSaveAs,
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
          title: tab.path === null
            ? `${t('editor.untitled')}.${tab.untitledExt}`
            : fileName(tab.path),
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
                id: 'new',
                label: t('menu.new'),
                onSelect: handleNew,
              },
              {
                id: 'open',
                label: t('menu.open'),
                onSelect: () => {
                  void handleOpen();
                },
              },
              {
                id: 'save-as',
                label: t('menu.saveAs'),
                onSelect: () => {
                  void handleSaveAs();
                },
              },
              {
                id: 'settings',
                label: t('menu.settings'),
                onSelect: () => {
                  setSettingsOpen(true);
                },
              },
              {
                id: 'markdown-cheat-sheet',
                label: t('menu.markdownCheatSheet'),
                onSelect: () => {
                  setMarkdownCheatSheetOpen(true);
                },
              },
              {
                id: 'shortcuts',
                label: t('menu.shortcuts'),
                onSelect: () => {
                  setShortcutsOpen(true);
                },
              },
              {
                id: 'startup-timing',
                label: t('menu.startupTiming'),
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
        aria-label={t('editor.ariaSource')}
      >
        {tabs.length === 0 && (
          <p className={cn('p-4 text-sm text-(--app-muted)')}>
            {t('empty.hint', { mod: modKey })}
          </p>
        )}
        {tabs.map((tab) => {
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
                key={`${tab.id}:${tab.docEpoch}`}
                tabId={tab.id}
                path={tab.path}
                languagePath={tabLanguagePath(tab)}
                onDirty={handleDirty}
                onBlur={handleEditorBlur}
                onReady={handleEditorReady}
                onDestroy={handleEditorDestroy}
                onLoadError={handleLoadError}
                onPathResolved={handlePathResolved}
              />
            </div>
          );
        })}
        {activeTab?.path === null && (
          <UntitledExtPicker
            ext={activeTab.untitledExt}
            onChange={(ext) => {
              handleUntitledExtChange(activeTab.id, ext);
            }}
          />
        )}
        {activeTab !== null && (
          <PreviewOverlay
            open={previewOpen}
            languagePath={tabLanguagePath(activeTab)}
            filePath={activeTab.path}
            source={previewSource}
            onOpenInBrowser={handleOpenHtmlInBrowser}
          />
        )}
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
