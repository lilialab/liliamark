import { Compartment, Transaction } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { useEffect, useEffectEvent, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { openTextPath } from '../lib/tauri/fs';
import { useAppSettingsStore } from '../stores/appSettingsStore';
import { cn } from '../utils/cn';
import { createDelayedShow } from '../utils/delayedShow';
import { sameFilePath } from '../utils/path';
import { baseExtensions } from './editorExtensions';
import { indentExtensions } from './indent';
import { loadLanguageExtension } from './languageRegistry';
import { bindEditableCompartment, setViewUserEditable } from './viewEditable';
import './codeEditor.css';

type CodeEditorProps = {
  /** 实例标识（如 tab id），回调一律带回 */
  tabId: string;
  /** 已落盘路径；null 表示未命名，不读盘 */
  path: string | null;
  /** 语言 / 高亮用路径（未命名时为 untitled.ext） */
  languagePath: string;
  onDirty: (tabId: string) => void;
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
  onDirty,
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

  const isCurrentView = (view: EditorView) => editorViewRef.current === view;

  const reportDirty = useEffectEvent(() => {
    onDirty(tabId);
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

  const hydrateFromDisk = useEffectEvent(async (
    editorView: EditorView,
    filePath: string,
    cancelLoading: () => void,
  ) => {
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
      setViewUserEditable(editorView, true);
      notifyReady(editorView);
    } catch (error) {
      if (isCurrentView(editorView)) {
        notifyLoadError(error);
      }
    } finally {
      cancelLoading();
    }
  });

  const indentStyle = useAppSettingsStore((state) => state.settings.indentStyle);
  const indentSize = useAppSettingsStore((state) => state.settings.indentSize);

  // 挂载空 EditorView；未命名直接就绪，否则读盘
  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const languageCompartment = new Compartment();
    const indentCompartment = new Compartment();
    const editableCompartment = new Compartment();
    languageCompartmentRef.current = languageCompartment;
    indentCompartmentRef.current = indentCompartment;

    const { indentStyle: style, indentSize: size } = useAppSettingsStore.getState().settings;
    const editorView = new EditorView({
      doc: '',
      extensions: [
        ...baseExtensions,
        indentCompartment.of(indentExtensions(style, size)),
        languageCompartment.of([]),
        editableCompartment.of([]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !hydratingRef.current) {
            reportDirty();
          }
        }),
      ],
      parent: containerRef.current,
    });
    bindEditableCompartment(editorView, editableCompartment);
    editorViewRef.current = editorView;

    let cancelHydrateLoading = () => {};
    if (path === null) {
      notifyReady(editorView);
    } else {
      setViewUserEditable(editorView, false);
      cancelHydrateLoading = createDelayedShow(() => {
        const loadingId = toast.loading(t('toast.openingFile'));
        return () => {
          toast.dismiss(loadingId);
        };
      });
      void hydrateFromDisk(editorView, path, cancelHydrateLoading);
    }

    return () => {
      cancelHydrateLoading();
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
      effects: indentCompartment.reconfigure(indentExtensions(indentStyle, indentSize)),
    });
  }, [indentStyle, indentSize]);

  return (
    <div
      ref={containerRef}
      className={cn('code-editor h-full', className)}
    />
  );
}
