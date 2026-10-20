import { describe, expect, it } from 'vitest';
import { editorSessionFromTabs, resolveActiveTabId } from '../../src/utils/editorSession';

describe('editorSessionFromTabs', () => {
  it('maps paths and active path in tab order', () => {
    expect(
      editorSessionFromTabs(
        [
          { id: '1', path: 'a.md' },
          { id: '2', path: 'b.md' },
        ],
        '2',
      ),
    ).toEqual({
      paths: ['a.md', 'b.md'],
      activePath: 'b.md',
    });
  });

  it('uses null activePath when empty or id missing', () => {
    expect(editorSessionFromTabs([], null)).toEqual({
      paths: [],
      activePath: null,
    });
    expect(
      editorSessionFromTabs([{ id: '1', path: 'a.md' }], 'missing'),
    ).toEqual({
      paths: ['a.md'],
      activePath: null,
    });
  });
});

describe('resolveActiveTabId', () => {
  it('prefers matching active path, else first tab', () => {
    const tabs = [
      { id: '1', path: 'a.md' },
      { id: '2', path: 'b.md' },
    ];
    expect(resolveActiveTabId(tabs, 'b.md')).toBe('2');
    expect(resolveActiveTabId(tabs, 'missing.md')).toBe('1');
    expect(resolveActiveTabId([], 'a.md')).toBeNull();
  });
});
