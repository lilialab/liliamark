import { Compartment, Transaction } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { openTextPath } from '../lib/tauri/fs';
import { useAppSettings } from '../stores/appSettingsStore';
import { cn } from '../utils/cn';
import type { EditorCaretStatus } from '../utils/editorStatus';
import { readEditorCaretStatus } from '../utils/editorStatus';
import { sameFilePath } from '../utils/path';
import { EditorBusyOverlay } from './EditorBusyOverlay';
import { baseExtensions } from './editorExtensions';
import { indentExtensions } from './indent';
import { loadLanguageExtension } from './languageRegistry';
import './codeEditor.css';

type CodeEditorProps = {
  /** 实例标识（如 tab id），回调一律带回 */
  tabId: string;
  /** 已落盘路径；null 表示未命名，不读盘 */
  path: string | null;
  /** 语言 / 高亮用路径（未命名时为 untitled.ext） */
  languagePath: string;
  /** 外部忙碌文案（如格式化）；优先于打开中蒙版 */
  busyMessage?: string | null;
  onDirty: (tabId: string) => void;
  /** 文档或主选区变化时（含水合）；调用方按 active tab 过滤 */
  onCaretStatus: (tabId: string, status: EditorCaretStatus) => void;
  /** 就绪后调用（读盘成功或未命名空文档） */
  onReady: (tabId: string, editorView: EditorView) => void;
  onDestroy: (tabId: string) => void;
  onLoadError: (tabId: string, error: unknown) => void;
  /** 读盘返回的路径与 prop 不一致时（规范化等） */
  onPathResolved: (tabId: string, path: string) => void;
  className?: string;
};

export function CodeEditor({
  tabId,
  path,
  languagePath,
  busyMessage = null,
  onDirty,
  onCaretStatus,
  onReady,
  onDestroy,
  onLoadError,
  onPathResolved,
  className,
}: CodeEditorProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const indentCompartmentRef = useRef<Compartment | null>(null);
  const languageCompartmentRef = useRef<Compartment | null>(null);
  const hydratingRef = useRef(false);
  const [opening, setOpening] = useState(path !== null);

  const isCurrentView = (view: EditorView) => editorViewRef.current === view;

  const reportDirty = useEffectEvent(() => {
    onDirty(tabId);
  });
  const reportCaretStatus = useEffectEvent((status: EditorCaretStatus) => {
    onCaretStatus(tabId, status);
  });
  const notifyReady = useEffectEvent((editorView: EditorView) => {
    onReady(tabId, editorView);
  });
  const notifyDestroy = useEffectEvent(() => {
    onDestroy(tabId);
  });
  const notifyLoadError = useEffectEvent((error: unknown) => {
    onLoadError(tabId, error);
  });
  const notifyPathResolved = useEffectEvent((resolvedPath: string) => {
    onPathResolved(tabId, resolvedPath);
  });

  const hydrateFromDisk = useEffectEvent(async (editorView: EditorView, filePath: string) => {
    try {
      const file = await openTextPath(filePath);
      if (!isCurrentView(editorView)) {
        return;
      }

      hydratingRef.current = true;
      editorView.dispatch({
        changes: { from: 0, to: editorView.state.doc.length, insert: file.content },
        annotations: [Transaction.addToHistory.of(false)],
      });
      hydratingRef.current = false;

      if (!sameFilePath(filePath, file.path)) {
        notifyPathResolved(file.path);
      }
      notifyReady(editorView);
    } catch (error) {
      if (isCurrentView(editorView)) {
        notifyLoadError(error);
      }
    } finally {
      if (isCurrentView(editorView)) {
        setOpening(false);
      }
    }
  });

  const { indentSize } = useAppSettings();

  // 挂载空 EditorView；未命名直接就绪，否则读盘
  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const languageCompartment = new Compartment();
    const indentCompartment = new Compartment();
    languageCompartmentRef.current = languageCompartment;
    indentCompartmentRef.current = indentCompartment;

    const editorView = new EditorView({
      doc: '',
      extensions: [
        ...baseExtensions,
        indentCompartment.of(indentExtensions(indentSize)),
        languageCompartment.of([]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !hydratingRef.current) {
            reportDirty();
          }
          if (update.docChanged || update.selectionSet) {
            reportCaretStatus(readEditorCaretStatus(update.state));
          }
        }),
      ],
      parent: containerRef.current,
    });
    editorViewRef.current = editorView;
    reportCaretStatus(readEditorCaretStatus(editorView.state));

    if (path === null) {
      setOpening(false);
      notifyReady(editorView);
    } else {
      setOpening(true);
      void hydrateFromDisk(editorView, path);
    }

    return () => {
      notifyDestroy();
      editorView.destroy();
      editorViewRef.current = null;
      indentCompartmentRef.current = null;
      languageCompartmentRef.current = null;
    };
    // 只在挂载时建 EditorView；path / 重载靠外层 key remount
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-once
  }, []);

  // 语言随 languagePath 变化（未命名改后缀）
  useEffect(() => {
    const editorView = editorViewRef.current;
    const languageCompartment = languageCompartmentRef.current;
    if (!editorView || !languageCompartment) {
      return;
    }

    let cancelled = false;
    void loadLanguageExtension(languagePath).then((extension) => {
      if (cancelled || !isCurrentView(editorView)) {
        return;
      }
      editorView.dispatch({
        effects: languageCompartment.reconfigure(extension),
      });
    });

    return () => {
      cancelled = true;
    };
  }, [languagePath]);

  // 设置变更时重配缩进
  useEffect(() => {
    const editorView = editorViewRef.current;
    const indentCompartment = indentCompartmentRef.current;
    if (!editorView || !indentCompartment) {
      return;
    }
    editorView.dispatch({
      effects: indentCompartment.reconfigure(indentExtensions(indentSize)),
    });
  }, [indentSize]);

  const overlayMessage = busyMessage ?? (opening ? t('editor.busyOpening') : null);
  const wasBusyRef = useRef(false);

  useEffect(() => {
    const view = editorViewRef.current;
    if (!view) {
      return;
    }
    if (overlayMessage) {
      wasBusyRef.current = true;
      view.contentDOM.blur();
      return;
    }
    if (wasBusyRef.current) {
      wasBusyRef.current = false;
      view.focus();
    }
  }, [overlayMessage]);

  return (
    <div className={cn('relative h-full', className)}>
      <div
        ref={containerRef}
        className={cn('code-editor h-full')}
        inert={overlayMessage ? true : undefined}
      />
      {overlayMessage && <EditorBusyOverlay message={overlayMessage} />}
    </div>
  );
}
