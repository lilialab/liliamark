import { selectAll } from '@codemirror/commands';
import type { EditorView } from '@codemirror/view';
import { arrayMove } from '@dnd-kit/sortable';
import { FilePlus, FolderOpen, Keyboard, Save, Settings } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { CodeEditor } from '../editor/CodeEditor';
import { formatEditorDocument, supportsDocumentFormat } from '../editor/formatDocument';
import { languageDisplayName } from '../editor/languageRegistry';
import {
  closeCurrentWindow,
  focusCurrentWindow,
  pickSaveTextFile,
  pickTextFile,
  writeTextFile,
} from '../lib/tauri/fs';
import { openLocalPath } from '../lib/tauri/opener';
import { getAppSettings, useAppSettings } from '../stores/appSettingsStore';
import type { DiskChangeKind } from '../types/diskFileChanged';
import type { EditorTab } from '../types/editorTab';
import { cn } from '../utils/cn';
import { LARGE_DOC_MAX_LENGTH } from '../utils/docLimits';
import { resolveActiveTabId } from '../utils/editorSession';
import type { EditorCaretStatus } from '../utils/editorStatus';
import { readEditorCaretStatus } from '../utils/editorStatus';
import {
  createTabId,
  updateTab,
  withDiskChange,
  withDiskReload,
  withoutDiskChange,
  withSaved,
} from '../utils/editorTab';
import { errorMessage } from '../utils/errorMessage';
import { fileName, sameFilePath } from '../utils/path';
import { sniffUntitledExt } from '../utils/sniffUntitledExt';
import { markStartupUiReady } from '../utils/startupTiming';
import {
  DEFAULT_UNTITLED_EXT,
  isDefaultUntitled,
  isUntitled,
  tabLanguagePath,
} from '../utils/untitled';
import { AppMenu, type AppMenuEntry } from './components/AppMenu';
import { DiskChangeBanner } from './components/DiskChangeBanner';
import { EditorStatusBar } from './components/EditorStatusBar';
import { EditorTabBar } from './components/EditorTabBar';
import { FileDragOverlay } from './components/FileDragOverlay';
import { MarkdownCheatSheetOverlay } from './components/MarkdownCheatSheetOverlay';
import { PreviewOverlay } from './components/PreviewOverlay';
import { SettingsOverlay } from './components/SettingsOverlay';
import { ShortcutsOverlay } from './components/ShortcutsOverlay';
import { StartupTimingOverlay } from './components/StartupTimingOverlay';
import { modifierKeyLabel } from './help/editorHotkeyHints';
import { useAppUpdateCheck } from './hooks/useAppUpdateCheck';
import { useBlockBrowserShortcuts } from './hooks/useBlockBrowserShortcuts';
import { useConfirmDialog } from './hooks/useConfirmDialog';
import { useDiskWatch } from './hooks/useDiskWatch';
import { useEditorHotkeys } from './hooks/useEditorHotkeys';
import { useExternalOpenFile } from './hooks/useExternalOpenFile';
import { useFileDragOpen } from './hooks/useFileDragOpen';
import { usePersistEditorSession } from './hooks/usePersistEditorSession';
import { useRestoreEditorSession } from './hooks/useRestoreEditorSession';
import { useSaveOnBlur } from './hooks/useSaveOnBlur';
import { useUnsavedCloseGuard } from './hooks/useUnsavedCloseGuard';

export function EditorScreen() {
  /* -------------------------------------------------------------------------- */
  /* State & data */
  /* -------------------------------------------------------------------------- */

  const { t } = useTranslation();
  const { indentSize } = useAppSettings();
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
  const { checkForUpdates } = useAppUpdateCheck();
  const [tabs, setTabs] = useState<EditorTab[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSource, setPreviewSource] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [markdownCheatSheetOpen, setMarkdownCheatSheetOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [startupTimingOpen, setStartupTimingOpen] = useState(false);
  const [caretStatus, setCaretStatus] = useState<EditorCaretStatus | null>(null);

  const editorViewsRef = useRef(new Map<string, EditorView>());
  const [formattingTabIds, setFormattingTabIds] = useState(() => new Set<string>());
  const [savingTabIds, setSavingTabIds] = useState(() => new Set<string>());
  const tabsRef = useRef(tabs);
  tabsRef.current = tabs;
  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;

  function tabBusyMessage(tabId: string): string | null {
    if (formattingTabIds.has(tabId)) {
      return t('editor.busyFormatting');
    }
    if (savingTabIds.has(tabId)) {
      return t('editor.busySaving');
    }
    return null;
  }

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

  /** 设置开启且体积未超限时，保存前格式化缓冲区；失败只 toast，仍继续存 */
  async function formatTabBeforeSave(tab: EditorTab): Promise<void> {
    const tabId = tab.id;
    if (formattingTabIds.has(tabId)) {
      return;
    }
    const editorView = editorViewsRef.current.get(tabId);
    if (!editorView) {
      return;
    }
    const { formatOnSave, indentSize } = getAppSettings();
    const languagePath = tabLanguagePath(tab);
    if (
      !formatOnSave
      || !supportsDocumentFormat(languagePath)
      || editorView.state.doc.length > LARGE_DOC_MAX_LENGTH
    ) {
      return;
    }

    setFormattingTabIds((prev) => new Set(prev).add(tabId));
    try {
      await formatEditorDocument(editorView, {
        languagePath,
        indentSize,
      });
      refreshPreview(tabId);
    } catch (error) {
      toast.error(t('toast.formatFailed'), { description: errorMessage(error) });
    } finally {
      setFormattingTabIds((prev) => {
        const next = new Set(prev);
        next.delete(tabId);
        return next;
      });
    }
  }

  /** 保存指定已落盘标签；写盘期间若正文又变了则保持 dirty。成功 true */
  async function saveTab(
    tabId: string,
    options?: { requireReadyToast?: boolean },
  ): Promise<boolean> {
    const tab = tabsRef.current.find((item) => item.id === tabId);
    if (!tab?.dirty || tab.path === null) {
      return true;
    }
    if (savingTabIds.has(tabId)) {
      return false;
    }

    await formatTabBeforeSave(tab);

    const content = readDoc(tabId);
    if (content === null) {
      if (options?.requireReadyToast) {
        toast.error(t('toast.saveFailed'), { description: t('toast.editorNotReady') });
      }
      return false;
    }

    setSavingTabIds((prev) => new Set(prev).add(tabId));
    try {
      await writeTextFile(tab.path, content);
      setTabs((prev) => {
        const latest = readDoc(tabId);
        if (latest !== null && latest !== content) {
          return prev;
        }
        return updateTab(prev, tabId, withSaved);
      });
      return true;
    } catch (error) {
      toast.error(t('toast.saveFailed'), { description: errorMessage(error) });
      return false;
    } finally {
      setSavingTabIds((prev) => {
        const next = new Set(prev);
        next.delete(tabId);
        return next;
      });
    }
  }

  /** 另存为：选路径写入；当前标签切到新路径（未命名即晋升）。取消或失败 false */
  async function saveTabAs(tabId: string): Promise<boolean> {
    const tab = tabsRef.current.find((item) => item.id === tabId);
    if (!tab) {
      return false;
    }
    if (savingTabIds.has(tabId)) {
      return false;
    }

    await formatTabBeforeSave(tab);

    const content = readDoc(tabId);
    if (content === null) {
      toast.error(t('toast.saveFailed'), { description: t('toast.editorNotReady') });
      return false;
    }

    setSavingTabIds((prev) => new Set(prev).add(tabId));
    try {
      const defaultName = tab.path === null
        ? `${t('editor.untitled')}.${tab.untitledExt}`
        : fileName(tab.path);
      const path = await pickSaveTextFile(defaultName);
      if (!path) {
        return false;
      }

      await writeTextFile(path, content);
      setTabs((prev) => {
        const latest = readDoc(tabId);
        if (latest !== null && latest !== content) {
          return updateTab(prev, tabId, (item) => ({ ...item, path }));
        }
        return updateTab(prev, tabId, (item) => withSaved({ ...item, path }));
      });
      return true;
    } catch (error) {
      toast.error(t('toast.saveFailed'), { description: errorMessage(error) });
      return false;
    } finally {
      setSavingTabIds((prev) => {
        const next = new Set(prev);
        next.delete(tabId);
        return next;
      });
    }
  }

  /** 有路径则保存，未命名则另存为 */
  async function saveTabOrAs(tabId: string): Promise<boolean> {
    const tab = tabsRef.current.find((item) => item.id === tabId);
    if (!tab) {
      return false;
    }
    if (tab.path === null) {
      return await saveTabAs(tabId);
    }
    return await saveTab(tabId, { requireReadyToast: true });
  }

  /** 退出前保存全部脏标签（含未命名）；任一取消/失败则 false */
  async function saveAllDirtyTabs(): Promise<boolean> {
    const dirtyIds = tabsRef.current.filter((tab) => tab.dirty).map((tab) => tab.id);
    for (const id of dirtyIds) {
      if (!(await saveTabOrAs(id))) {
        return false;
      }
    }
    return true;
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
    const tab = tabsRef.current.find((item) => item.id === tabId);
    if (!isUntitled(tab) || tab.untitledExt === ext) {
      return;
    }
    setTabs((prev) =>
      updateTab(prev, tabId, (item) => isUntitled(item) ? { ...item, untitledExt: ext } : item)
    );
  }

  /** 未命名 + 默认 md + 空文档粘贴：嗅探成功才改后缀 */
  function handleEmptyPaste(tabId: string, text: string) {
    const ext = sniffUntitledExt(text);
    if (!ext || ext === DEFAULT_UNTITLED_EXT) {
      return;
    }
    const tab = tabsRef.current.find((item) => item.id === tabId);
    if (!isDefaultUntitled(tab)) {
      return;
    }
    setTabs((prev) =>
      updateTab(
        prev,
        tabId,
        (item) => isDefaultUntitled(item) ? { ...item, untitledExt: ext } : item,
      )
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

  function handleEditorReady(tabId: string, editorView: EditorView) {
    editorViewsRef.current.set(tabId, editorView);
    refreshPreview(tabId);
    if (tabId !== activeIdRef.current) {
      return;
    }

    setCaretStatus(readEditorCaretStatus(editorView.state));

    async function focusEditor() {
      await focusCurrentWindow();
      if (editorViewsRef.current.get(tabId) === editorView) {
        editorView.focus();
      }
    }

    void focusEditor();
  }

  function handleEditorDestroy(tabId: string) {
    editorViewsRef.current.delete(tabId);
    if (tabId === activeIdRef.current) {
      setCaretStatus(null);
    }
  }

  function handleCaretStatus(tabId: string, status: EditorCaretStatus) {
    if (tabId !== activeIdRef.current) {
      return;
    }
    setCaretStatus(status);
  }

  useEffect(() => {
    if (activeId === null) {
      setCaretStatus(null);
      return;
    }
    const editorView = editorViewsRef.current.get(activeId);
    setCaretStatus(
      editorView ? readEditorCaretStatus(editorView.state) : null,
    );
  }, [activeId]);

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

    if (tab.dirty) {
      const title = tab.path === null
        ? `${t('editor.untitled')}.${tab.untitledExt}`
        : fileName(tab.path);
      const result = await confirm({
        message: t('dialog.discardChanges', { title }),
        primaryLabel: t('dialog.save'),
        secondaryLabel: t('dialog.discard'),
      });
      if (result === 'cancel') {
        return;
      }
      if (result === 'primary' && !(await saveTabOrAs(id))) {
        return;
      }
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

  async function handleFormatDocument() {
    if (activeTab === null) {
      return;
    }
    const tabId = activeTab.id;
    if (formattingTabIds.has(tabId)) {
      return;
    }
    const languagePath = tabLanguagePath(activeTab);
    if (!supportsDocumentFormat(languagePath)) {
      toast.error(t('toast.formatUnsupported'));
      return;
    }
    const editorView = editorViewsRef.current.get(tabId);
    if (!editorView) {
      toast.error(t('toast.formatFailed'), { description: t('toast.editorNotReady') });
      return;
    }
    const { indentSize } = getAppSettings();
    setFormattingTabIds((prev) => new Set(prev).add(tabId));
    try {
      await formatEditorDocument(editorView, {
        languagePath,
        indentSize,
      });
      refreshPreview(tabId);
    } catch (error) {
      toast.error(t('toast.formatFailed'), { description: errorMessage(error) });
    } finally {
      setFormattingTabIds((prev) => {
        const next = new Set(prev);
        next.delete(tabId);
        return next;
      });
    }
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

  const sessionReady = useRestoreEditorSession(applyRestoredSession);
  const fileDragActive = useFileDragOpen(loadFile);
  useExternalOpenFile(loadFile, sessionReady);
  usePersistEditorSession(tabs, activeId);
  useDiskWatch(
    tabs.map((tab) => tab.path).filter((path): path is string => path !== null),
    handleDiskChange,
  );
  useUnsavedCloseGuard(getDirtyTabCount, async (count) => {
    const result = await confirm({
      message: t('dialog.discardUnsavedTabs', { count }),
      primaryLabel: t('dialog.save'),
      secondaryLabel: t('dialog.discard'),
    });
    if (result === 'cancel') {
      return false;
    }
    if (result === 'secondary') {
      return true;
    }
    return await saveAllDirtyTabs();
  });
  useSaveOnBlur(async () => {
    if (!getAppSettings().saveOnBlur) {
      return;
    }
    const ids = tabsRef.current
      .filter((tab) => {
        if (!tab.dirty || tab.path === null) {
          return false;
        }
        const doc = readDoc(tab.id);
        return doc !== null && doc.length <= LARGE_DOC_MAX_LENGTH;
      })
      .map((tab) => tab.id);
    for (const id of ids) {
      await saveTab(id);
    }
  });
  useBlockBrowserShortcuts();
  useEditorHotkeys({
    onNew: handleNew,
    onSave: handleSave,
    onSaveAs: handleSaveAs,
    onTogglePreview: handleTogglePreview,
    onCloseTab: handleCloseTabHotkey,
    onCloseWindow: handleCloseWindowHotkey,
    onSelectAllInEditor: handleSelectAllInEditor,
    onFormatDocument: handleFormatDocument,
  });

  /* -------------------------------------------------------------------------- */
  /* App menu */
  /* -------------------------------------------------------------------------- */

  function appMenuItems(): AppMenuEntry[] {
    return [
      {
        id: 'new',
        label: t('menu.new'),
        icon: FilePlus,
        onSelect: handleNew,
      },
      {
        id: 'open',
        label: t('menu.open'),
        icon: FolderOpen,
        onSelect: () => {
          void handleOpen();
        },
      },
      {
        id: 'save-as',
        label: t('menu.saveAs'),
        icon: Save,
        onSelect: () => {
          void handleSaveAs();
        },
      },
      { id: 'sep-file', separator: true },
      {
        id: 'settings',
        label: t('menu.settings'),
        icon: Settings,
        onSelect: () => {
          setSettingsOpen(true);
        },
      },
      { id: 'sep-settings', separator: true },
      {
        id: 'shortcuts',
        label: t('menu.shortcuts'),
        icon: Keyboard,
        onSelect: () => {
          setShortcutsOpen(true);
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
        id: 'startup-timing',
        label: t('menu.startupTiming'),
        onSelect: () => {
          setStartupTimingOpen(true);
        },
      },
      {
        id: 'check-update',
        label: t('menu.checkUpdate'),
        onSelect: checkForUpdates,
      },
    ];
  }

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
        trailing={<AppMenu items={appMenuItems()} />}
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
        {sessionReady && tabs.length === 0 && (
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
                busyMessage={tabBusyMessage(tab.id)}
                onDirty={handleDirty}
                onCaretStatus={handleCaretStatus}
                onReady={handleEditorReady}
                onDestroy={handleEditorDestroy}
                onLoadError={handleLoadError}
                onPathResolved={handlePathResolved}
                onEmptyPaste={handleEmptyPaste}
              />
            </div>
          );
        })}
        {activeTab !== null && (
          <PreviewOverlay
            open={previewOpen}
            languagePath={tabLanguagePath(activeTab)}
            filePath={activeTab.path}
            source={previewSource}
            onOpenInBrowser={handleOpenHtmlInBrowser}
          />
        )}
      </section>

      {activeTab && caretStatus && (
        <EditorStatusBar
          key={activeTab.id}
          languageName={languageDisplayName(tabLanguagePath(activeTab))}
          indentSize={indentSize}
          caret={caretStatus}
          path={activeTab.path}
          untitledExt={activeTab.untitledExt}
          onUntitledExtChange={(ext) => {
            handleUntitledExtChange(activeTab.id, ext);
          }}
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
      {confirmDialog}
    </div>
  );
}
