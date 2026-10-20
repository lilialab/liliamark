import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { defaultHighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { Compartment, EditorState } from '@codemirror/state';
import {
  drawSelection,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
} from '@codemirror/view';
import { useEffect, useRef } from 'react';
import { cn } from '../utils/cn';
import { editorLanguageKind } from './editorLanguageKind';
import { loadLanguageExtension } from './loadLanguageExtension';

type MarkdownEditorProps = {
  path: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

const baseExtensions = [
  lineNumbers(),
  highlightActiveLineGutter(),
  highlightSpecialChars(),
  history(),
  drawSelection(),
  EditorState.allowMultipleSelections.of(true),
  syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
  highlightActiveLine(),
  keymap.of([...defaultKeymap, ...historyKeymap]),
];

export function MarkdownEditor({ path, value, onChange, className }: MarkdownEditorProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const languageCompartmentRef = useRef<Compartment | null>(null);
  const languageLoadSeqRef = useRef(0);
  const onChangeRef = useRef(onChange);
  const initialValueRef = useRef(value);
  onChangeRef.current = onChange;

  const languageKind = editorLanguageKind(path);

  useEffect(() => {
    if (!parentRef.current) {
      return;
    }

    const languageCompartment = new Compartment();
    languageCompartmentRef.current = languageCompartment;

    const view = new EditorView({
      doc: initialValueRef.current,
      extensions: [
        ...baseExtensions,
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
    };
  }, []);

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
      className={cn('markdown-editor h-full', className)}
    />
  );
}
