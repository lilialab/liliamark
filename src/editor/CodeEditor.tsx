import { Compartment, Transaction } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { useEffect, useEffectEvent, useRef } from 'react';
import { openTextPath } from '../lib/tauri/fs';
import { useAppSettingsStore } from '../stores/appSettingsStore';
import { cn } from '../utils/cn';
import { sameFilePath } from '../utils/path';
import { baseExtensions } from './editorExtensions';
import { indentExtensions } from './indent';
import { loadLanguageExtension } from './languageRegistry';
import './codeEditor.css';

type CodeEditorProps = {
  path: string;
  onDirty: () => void;
  /** 编辑器 DOM 失焦（点到菜单、预览、其它控件等） */
  onBlur: () => void;
  /** 读盘成功并写入文档后调用 */
  onReady: (editorView: EditorView) => void;
  onDestroy: () => void;
  onLoadError: (error: unknown) => void;
  /** 读盘返回的路径与 prop 不一致时（规范化等） */
  onPathResolved: (path: string) => void;
  className?: string;
};

export function CodeEditor({
  path,
  onDirty,
  onBlur,
  onReady,
  onDestroy,
  onLoadError,
  onPathResolved,
  className,
}: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const indentCompartmentRef = useRef<Compartment | null>(null);
  const hydratingRef = useRef(false);

  const isCurrentView = (view: EditorView) => editorViewRef.current === view;

  const reportDirty = useEffectEvent(onDirty);
  const reportBlur = useEffectEvent(onBlur);
  const notifyReady = useEffectEvent(onReady);
  const notifyDestroy = useEffectEvent(onDestroy);
  const notifyLoadError = useEffectEvent(onLoadError);
  const notifyPathResolved = useEffectEvent(onPathResolved);

  const hydrateFromDisk = useEffectEvent(async (editorView: EditorView) => {
    try {
      const file = await openTextPath(path);
      if (!isCurrentView(editorView)) {
        return;
      }

      hydratingRef.current = true;
      editorView.dispatch({
        changes: { from: 0, to: editorView.state.doc.length, insert: file.content },
        annotations: [Transaction.addToHistory.of(false)],
      });
      hydratingRef.current = false;

      if (!sameFilePath(path, file.path)) {
        notifyPathResolved(file.path);
      }
      notifyReady(editorView);
    } catch (error) {
      if (isCurrentView(editorView)) {
        notifyLoadError(error);
      }
    }
  });

  const indentStyle = useAppSettingsStore((state) => state.settings.indentStyle);
  const indentSize = useAppSettingsStore((state) => state.settings.indentSize);

  // 挂载空 EditorView：按 path 定语言、读盘灌入；卸载时销毁
  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const languageCompartment = new Compartment();
    const indentCompartment = new Compartment();
    indentCompartmentRef.current = indentCompartment;

    const { indentStyle: style, indentSize: size } = useAppSettingsStore.getState().settings;
    const editorView = new EditorView({
      doc: '',
      extensions: [
        ...baseExtensions,
        indentCompartment.of(indentExtensions(style, size)),
        languageCompartment.of([]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !hydratingRef.current) {
            reportDirty();
          }
        }),
        EditorView.domEventHandlers({
          blur: () => {
            reportBlur();
            return false;
          },
        }),
      ],
      parent: containerRef.current,
    });
    editorViewRef.current = editorView;

    void loadLanguageExtension(path).then((extension) => {
      if (!isCurrentView(editorView)) {
        return;
      }
      editorView.dispatch({
        effects: languageCompartment.reconfigure(extension),
      });
    });
    void hydrateFromDisk(editorView);

    return () => {
      notifyDestroy();
      editorView.destroy();
      editorViewRef.current = null;
      indentCompartmentRef.current = null;
    };
    // 只在挂载时建 EditorView；path / 重载靠外层 key（如 docEpoch）remount
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-once
  }, []);

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
