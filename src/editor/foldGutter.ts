import { foldGutter } from '@codemirror/language';
import type { Extension } from '@codemirror/state';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { lucideMarkup } from './lucideDom';

/** 行号旁折叠标记：展开 = ChevronDown，已折 = ChevronRight */
function foldMarker(open: boolean): HTMLElement {
  const marker = document.createElement('span');
  marker.className = 'lm-fold-marker';
  marker.innerHTML = lucideMarkup(open ? ChevronDown : ChevronRight, 16);
  return marker;
}

/** CodeMirror 折叠 gutter（lucide 图标） */
export const editorFoldGutter: Extension = foldGutter({ markerDOM: foldMarker });
