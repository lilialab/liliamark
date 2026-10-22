import { Compartment } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { useEffect, useRef } from 'react';
import { useAppSettingsStore } from '../stores/appSettingsStore';
import { cn } from '../utils/cn';
import { baseExtensions } from './editorExtensions';
import { indentExtensions } from './indent';
import { editorLanguageKind, loadLanguageExtension } from './languageRegistry';
import './codeEditor.css';

type CodeEditorProps = {
  path: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

export function CodeEditor({ path, value, onChange, className }: CodeEditorProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const languageCompartmentRef = useRef<Compartment | null>(null);
  const indentCompartmentRef = useRef<Compartment | null>(null);
  const languageLoadSeqRef = useRef(0);
  const onChangeRef = useRef(onChange);
  const initialValueRef = useRef(value);
  onChangeRef.current = onChange;

  const indentStyle = useAppSettingsStore((state) => state.settings.indentStyle);
  const indentSize = useAppSettingsStore((state) => state.settings.indentSize);
  const languageKind = editorLanguageKind(path);

  useEffect(() => {
    if (!parentRef.current) {
      return;
    }

    const languageCompartment = new Compartment();
    const indentCompartment = new Compartment();
    languageCompartmentRef.current = languageCompartment;
    indentCompartmentRef.current = indentCompartment;

    const { indentStyle: style, indentSize: size } = useAppSettingsStore.getState().settings;
    const view = new EditorView({
      doc: initialValueRef.current,
      extensions: [
        ...baseExtensions,
        indentCompartment.of(indentExtensions(style, size)),
        languageCompartment.of([]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
      ],
      parent: parentRef.current,
    });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
      languageCompartmentRef.current = null;
      indentCompartmentRef.current = null;
    };
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    const indentCompartment = indentCompartmentRef.current;
    if (!view || !indentCompartment) {
      return;
    }
    view.dispatch({
      effects: indentCompartment.reconfigure(indentExtensions(indentStyle, indentSize)),
    });
  }, [indentStyle, indentSize]);

  useEffect(() => {
    const view = viewRef.current;
    const languageCompartment = languageCompartmentRef.current;
    if (!view || !languageCompartment) {
      return;
    }

    const seq = ++languageLoadSeqRef.current;
    let cancelled = false;

    void loadLanguageExtension(languageKind).then((extension) => {
      if (cancelled || seq !== languageLoadSeqRef.current || !viewRef.current) {
        return;
      }
      viewRef.current.dispatch({
        effects: languageCompartment.reconfigure(extension),
      });
    });

    return () => {
      cancelled = true;
    };
  }, [languageKind]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) {
      return;
    }

    const current = view.state.doc.toString();
    if (current === value) {
      return;
    }

    view.dispatch({
      changes: { from: 0, to: current.length, insert: value },
    });
  }, [value]);

  return (
    <div
      ref={parentRef}
      className={cn('code-editor h-full', className)}
    />
  );
}
