import { SearchQuery } from '@codemirror/search';
import { EditorState } from '@codemirror/state';
import { describe, expect, it } from 'vitest';
import { locateSearchMatches } from '../../src/editor/searchPanelMatch';

function stateWith(doc: string, head: number) {
  return EditorState.create({
    doc,
    selection: { anchor: head, head },
  });
}

describe('locateSearchMatches', () => {
  it('returns zeros for empty / invalid query', () => {
    const state = stateWith('abc abc', 0);
    expect(locateSearchMatches(state, new SearchQuery({ search: '' }), 0)).toEqual({
      total: 0,
      current: 0,
      capped: false,
    });
    expect(
      locateSearchMatches(state, new SearchQuery({ search: '(', regexp: true }), 0).total,
    ).toBe(0);
  });

  it('counts matches and current index', () => {
    const state = stateWith('foo bar foo', 8);
    const query = new SearchQuery({ search: 'foo' });
    expect(locateSearchMatches(state, query, 8)).toEqual({
      total: 2,
      current: 2,
      capped: false,
    });
  });

  it('caps at limit', () => {
    const state = stateWith('aaaa', 0);
    const query = new SearchQuery({ search: 'a' });
    expect(locateSearchMatches(state, query, 0, 2)).toEqual({
      total: 2,
      current: 1,
      capped: true,
    });
  });
});
