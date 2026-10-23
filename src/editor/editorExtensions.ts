import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import type { Extension } from '@codemirror/state';
import { highlightSpecialChars, keymap, lineNumbers } from '@codemirror/view';
import { tags } from '@lezer/highlight';
import { catppuccinEditorTheme } from '../theme/flavor';
import { highlightActiveLineExclusive } from './activeLineHighlight';
import { indentKeymap } from './indent';
import { markdownBoldKeymap } from './markdownBold';

/**
 * Markdown 语义挂稳定 class，样式走 CSS（特异性高于主题 StyleModule，
 * 才能盖掉 tags.heading 蓝 / tags.url 青绿等冲突）。
 */
const markdownHighlight = syntaxHighlighting(
  HighlightStyle.define([
    { tag: tags.heading1, class: 'cm-md-h1' },
    { tag: tags.heading2, class: 'cm-md-h2' },
    { tag: tags.heading3, class: 'cm-md-h3' },
    { tag: tags.heading4, class: 'cm-md-h4' },
    { tag: tags.heading5, class: 'cm-md-h5' },
    { tag: tags.heading6, class: 'cm-md-h6' },
    { tag: tags.strong, class: 'cm-md-strong' },
    { tag: tags.url, class: 'cm-md-url' },
    { tag: tags.monospace, class: 'cm-md-code' },
  ]),
);

/** 编辑器静态装配：行号 / 主题 / Markdown 语义色 / keymap（不含语言） */
export const baseExtensions: Extension[] = [
  lineNumbers(),
  highlightSpecialChars(),
  history(),
  catppuccinEditorTheme(),
  markdownHighlight,
  highlightActiveLineExclusive(),
  keymap.of([...indentKeymap, ...markdownBoldKeymap, ...defaultKeymap, ...historyKeymap]),
];
