import { type EditorState, type Extension, RangeSet } from '@codemirror/state';
import {
  Decoration,
  type DecorationSet,
  type EditorView,
  gutterLineClass,
  GutterMarker,
  ViewPlugin,
  type ViewUpdate,
} from '@codemirror/view';

const lineDeco = Decoration.line({ class: 'cm-activeLine' });

function selectionIsEmpty(state: EditorState): boolean {
  return state.selection.ranges.every((range) => range.empty);
}

/** 仅光标（无选区）时高亮当前行；有选区则关掉（对齐 VS Code） */
const activeLineHighlighter = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = this.getDeco(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.selectionSet) {
        this.decorations = this.getDeco(update.view);
      }
    }

    getDeco(view: EditorView) {
      if (!selectionIsEmpty(view.state)) {
        return Decoration.none;
      }
      let lastLineStart = -1;
      const deco = [];
      for (const range of view.state.selection.ranges) {
        const line = view.lineBlockAt(range.head);
        if (line.from > lastLineStart) {
          deco.push(lineDeco.range(line.from));
          lastLineStart = line.from;
        }
      }
      return Decoration.set(deco);
    }
  },
  { decorations: (v) => v.decorations },
);

const activeLineGutterMarker = new (class extends GutterMarker {
  elementClass = 'cm-activeLineGutter';
})();

const activeLineGutterHighlighter = gutterLineClass.compute(['selection'], (state) => {
  if (!selectionIsEmpty(state)) {
    return RangeSet.empty;
  }
  const marks = [];
  let last = -1;
  for (const range of state.selection.ranges) {
    const linePos = state.doc.lineAt(range.head).from;
    if (linePos > last) {
      last = linePos;
      marks.push(activeLineGutterMarker.range(linePos));
    }
  }
  return RangeSet.of(marks);
});

/** 当前行高亮（与非空选区互斥） */
export function highlightActiveLineExclusive(): Extension {
  return [activeLineHighlighter, activeLineGutterHighlighter];
}
