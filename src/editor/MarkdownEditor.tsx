import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
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
import { tags } from '@lezer/highlight';
import { useEffect, useRef } from 'react';
import { catppuccinEditorTheme, strongAccentColor } from '../theme/flavor';
import { cn } from '../utils/cn';
import { editorLanguageKind, loadLanguageExtension } from './languageRegistry';

type MarkdownEditorProps = {
  path: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

/** 加粗 → 红色高亮（盖过主题默认仅 bold） */
const strongHighlight = syntaxHighlighting(
  HighlightStyle.define([
    {
      tag: tags.strong,
      color: strongAccentColor(),
      fontWeight: 'bold',
    },
  ]),
);

const baseExtensions = [
  lineNumbers(),
  highlightActiveLineGutter(),
  highlightSpecialChars(),
  history(),
  drawSelection(),
  EditorState.allowMultipleSelections.of(true),
  catppuccinEditorTheme(),
  strongHighlight,
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
