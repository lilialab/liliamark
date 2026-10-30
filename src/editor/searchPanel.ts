import {
  closeSearchPanel,
  findNext,
  findPrevious,
  getSearchQuery,
  replaceAll,
  replaceNext,
  SearchQuery,
  setSearchQuery,
} from '@codemirror/search';
import type { EditorView, Panel, ViewUpdate } from '@codemirror/view';
import { runScopeHandlers } from '@codemirror/view';
import type { LucideIcon } from 'lucide-react';
import {
  CaseSensitive,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Regex,
  Replace,
  ReplaceAll,
  WholeWord,
  X,
} from 'lucide-react';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import i18n from '../i18n';
import { locateSearchMatches } from './searchPanelMatch';

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | boolean | undefined> = {},
  children: (Node | string)[] = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === false) {
      continue;
    }
    if (value === true) {
      node.setAttribute(key, '');
      continue;
    }
    node.setAttribute(key, value);
  }
  for (const child of children) {
    node.append(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

function lucideMarkup(Icon: LucideIcon, size: number): string {
  return renderToStaticMarkup(
    createElement(Icon, {
      size,
      strokeWidth: 2,
      'aria-hidden': true,
    }),
  );
}

function setButtonIcon(button: HTMLButtonElement, Icon: LucideIcon, size = 14) {
  button.innerHTML = lucideMarkup(Icon, size);
}

function makeIconButton(
  className: string,
  Icon: LucideIcon,
  onClick: () => void,
): HTMLButtonElement {
  const button = el('button', {
    type: 'button',
    class: className,
  }) as HTMLButtonElement;
  setButtonIcon(button, Icon);
  button.addEventListener('click', (event) => {
    event.preventDefault();
    onClick();
  });
  return button;
}

function setToggle(button: HTMLButtonElement, on: boolean) {
  button.classList.toggle('is-on', on);
  button.setAttribute('aria-pressed', on ? 'true' : 'false');
}

function setLabel(button: HTMLButtonElement, label: string) {
  button.setAttribute('aria-label', label);
  button.title = label;
}

/**
 * 布局对齐 VS Code Find：
 * [›] [ 查找输入 | Aa ab .* | 计数 ] [↑][↓][×]
 * [ ] [ 替换输入                   ] [替换][全部替换]
 */
class VscodeSearchPanel implements Panel {
  readonly dom: HTMLElement;
  readonly top = true;

  private readonly view: EditorView;
  private readonly searchField: HTMLInputElement;
  private readonly replaceField: HTMLInputElement;
  private readonly replaceRow: HTMLElement;
  private readonly countEl: HTMLElement;
  private readonly expandBtn: HTMLButtonElement;
  private readonly caseBtn: HTMLButtonElement;
  private readonly wordBtn: HTMLButtonElement;
  private readonly reBtn: HTMLButtonElement;
  private readonly prevBtn: HTMLButtonElement;
  private readonly nextBtn: HTMLButtonElement;
  private readonly closeBtn: HTMLButtonElement;
  private readonly replaceNextBtn: HTMLButtonElement;
  private readonly replaceAllBtn: HTMLButtonElement;

  private caseOn: boolean;
  private wordOn: boolean;
  private reOn: boolean;
  private replaceOpen = false;
  private query: SearchQuery;

  private readonly onLanguageChanged = () => {
    this.applyLabels();
    this.refreshCount();
  };

  constructor(view: EditorView) {
    this.view = view;
    this.query = getSearchQuery(view.state);
    this.caseOn = this.query.caseSensitive;
    this.wordOn = this.query.wholeWord;
    this.reOn = this.query.regexp;

    this.searchField = el('input', {
      type: 'text',
      class: 'lm-search-input',
      name: 'search',
      size: '1',
      'main-field': 'true',
      autocomplete: 'off',
      spellcheck: 'false',
    }) as HTMLInputElement;
    this.searchField.value = this.query.search;

    this.replaceField = el('input', {
      type: 'text',
      class: 'lm-search-input',
      name: 'replace',
      size: '1',
      autocomplete: 'off',
      spellcheck: 'false',
    }) as HTMLInputElement;
    this.replaceField.value = this.query.replace;

    this.countEl = el('span', { class: 'lm-search-count' });

    this.expandBtn = makeIconButton(
      'lm-search-expand',
      ChevronRight,
      () => this.setReplaceOpen(!this.replaceOpen),
    );
    this.expandBtn.setAttribute('aria-expanded', 'false');

    this.caseBtn = makeIconButton('lm-search-toggle', CaseSensitive, () => this.toggle('case'));
    this.wordBtn = makeIconButton('lm-search-toggle', WholeWord, () => this.toggle('word'));
    this.reBtn = makeIconButton('lm-search-toggle', Regex, () => this.toggle('re'));
    setToggle(this.caseBtn, this.caseOn);
    setToggle(this.wordBtn, this.wordOn);
    setToggle(this.reBtn, this.reOn);

    this.prevBtn = makeIconButton('lm-search-icon', ChevronUp, () => findPrevious(this.view));
    this.nextBtn = makeIconButton('lm-search-icon', ChevronDown, () => findNext(this.view));
    this.closeBtn = makeIconButton('lm-search-icon', X, () => closeSearchPanel(this.view));
    this.replaceNextBtn = makeIconButton('lm-search-icon', Replace, () => replaceNext(this.view));
    this.replaceAllBtn = makeIconButton('lm-search-icon', ReplaceAll, () => replaceAll(this.view));

    const findField = el('div', { class: 'lm-search-field' }, [
      this.searchField,
      el('div', { class: 'lm-search-toggles' }, [this.caseBtn, this.wordBtn, this.reBtn]),
      this.countEl,
    ]);
    const replaceField = el('div', { class: 'lm-search-field' }, [this.replaceField]);

    this.replaceRow = el('div', { class: 'lm-search-row' }, [
      el('span', { class: 'lm-search-expand-spacer', 'aria-hidden': 'true' }),
      replaceField,
      el('div', { class: 'lm-search-actions' }, [this.replaceNextBtn, this.replaceAllBtn]),
    ]);
    this.replaceRow.hidden = true;

    this.dom = el('div', { class: 'lm-search' }, [
      el('div', { class: 'lm-search-row' }, [
        this.expandBtn,
        findField,
        el('div', { class: 'lm-search-actions' }, [this.prevBtn, this.nextBtn, this.closeBtn]),
      ]),
      this.replaceRow,
    ]);

    this.dom.addEventListener('keydown', (event) => this.onKeyDown(event));
    this.searchField.addEventListener('input', () => this.commit());
    this.replaceField.addEventListener('input', () => this.commit());

    this.applyLabels();
    this.syncInvalid();
    this.refreshCount();
    i18n.on('languageChanged', this.onLanguageChanged);
  }

  mount() {
    this.searchField.select();
  }

  update(update: ViewUpdate) {
    let queryChanged = false;
    for (const tr of update.transactions) {
      for (const effect of tr.effects) {
        if (effect.is(setSearchQuery) && !effect.value.eq(this.query)) {
          this.applyQuery(effect.value);
          queryChanged = true;
        }
      }
    }
    if (queryChanged || update.docChanged || update.selectionSet) {
      this.refreshCount();
    }
  }

  destroy() {
    i18n.off('languageChanged', this.onLanguageChanged);
  }

  private setReplaceOpen(open: boolean) {
    this.replaceOpen = open;
    this.replaceRow.hidden = !open;
    setButtonIcon(this.expandBtn, open ? ChevronDown : ChevronRight);
    this.expandBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    this.applyExpandLabel();
    if (open) {
      this.replaceField.focus();
      this.replaceField.select();
    }
  }

  private applyExpandLabel() {
    const t = i18n.t.bind(i18n);
    setLabel(
      this.expandBtn,
      this.replaceOpen ? t('searchPanel.collapseReplace') : t('searchPanel.expandReplace'),
    );
  }

  private applyLabels() {
    const t = i18n.t.bind(i18n);
    this.searchField.placeholder = t('searchPanel.find');
    this.searchField.setAttribute('aria-label', t('searchPanel.find'));
    this.replaceField.placeholder = t('searchPanel.replace');
    this.replaceField.setAttribute('aria-label', t('searchPanel.replace'));

    this.applyExpandLabel();
    setLabel(this.caseBtn, t('searchPanel.matchCase'));
    setLabel(this.wordBtn, t('searchPanel.wholeWord'));
    setLabel(this.reBtn, t('searchPanel.regexp'));
    setLabel(this.prevBtn, t('searchPanel.previous'));
    setLabel(this.nextBtn, t('searchPanel.next'));
    setLabel(this.closeBtn, t('searchPanel.close'));
    setLabel(this.replaceNextBtn, t('searchPanel.replaceOne'));
    setLabel(this.replaceAllBtn, t('searchPanel.replaceAll'));
  }

  private toggle(kind: 'case' | 'word' | 're') {
    if (kind === 'case') {
      this.caseOn = !this.caseOn;
      setToggle(this.caseBtn, this.caseOn);
    } else if (kind === 'word') {
      this.wordOn = !this.wordOn;
      setToggle(this.wordBtn, this.wordOn);
    } else {
      this.reOn = !this.reOn;
      setToggle(this.reBtn, this.reOn);
    }
    this.commit();
  }

  private commit() {
    const next = new SearchQuery({
      search: this.searchField.value,
      replace: this.replaceField.value,
      caseSensitive: this.caseOn,
      wholeWord: this.wordOn,
      regexp: this.reOn,
    });
    if (next.eq(this.query)) {
      this.syncInvalid();
      return;
    }
    this.query = next;
    this.view.dispatch({ effects: setSearchQuery.of(next) });
    this.syncInvalid();
    this.refreshCount();
  }

  private applyQuery(query: SearchQuery) {
    this.query = query;
    this.caseOn = query.caseSensitive;
    this.wordOn = query.wholeWord;
    this.reOn = query.regexp;
    this.searchField.value = query.search;
    this.replaceField.value = query.replace;
    setToggle(this.caseBtn, this.caseOn);
    setToggle(this.wordBtn, this.wordOn);
    setToggle(this.reBtn, this.reOn);
    this.syncInvalid();
  }

  private syncInvalid() {
    const invalid = this.searchField.value.length > 0 && !this.query.valid;
    this.searchField.closest('.lm-search-field')?.classList.toggle('is-invalid', invalid);
  }

  private refreshCount() {
    const t = i18n.t.bind(i18n);
    if (this.searchField.value.length === 0) {
      this.countEl.textContent = '';
      this.countEl.classList.remove('is-empty');
      this.countEl.hidden = true;
      return;
    }
    this.countEl.hidden = false;
    if (!this.query.valid) {
      this.countEl.textContent = t('searchPanel.invalid');
      this.countEl.classList.add('is-empty');
      return;
    }

    const pos = locateSearchMatches(
      this.view.state,
      this.query,
      this.view.state.selection.main.head,
    );
    if (pos.total === 0) {
      this.countEl.textContent = t('searchPanel.noResults');
      this.countEl.classList.add('is-empty');
      return;
    }

    this.countEl.classList.remove('is-empty');
    const totalLabel = pos.capped ? `${pos.total}+` : String(pos.total);
    const currentLabel = pos.current > 0 ? String(pos.current) : '?';
    this.countEl.textContent = t('searchPanel.matchCount', {
      current: currentLabel,
      total: totalLabel,
    });
  }

  private onKeyDown(event: KeyboardEvent) {
    if (runScopeHandlers(this.view, event, 'search-panel')) {
      event.preventDefault();
      return;
    }
    if (event.key !== 'Enter') {
      return;
    }
    event.preventDefault();
    if (event.target === this.replaceField) {
      if (event.ctrlKey || event.metaKey) {
        replaceAll(this.view);
      } else {
        replaceNext(this.view);
      }
      return;
    }
    if (event.shiftKey) {
      findPrevious(this.view);
    } else {
      findNext(this.view);
    }
  }
}

/** VS Code 风格查找 / 替换面板 */
export function createVscodeSearchPanel(view: EditorView): Panel {
  return new VscodeSearchPanel(view);
}
