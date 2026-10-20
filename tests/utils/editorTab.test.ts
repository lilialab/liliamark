import { describe, expect, it } from 'vitest';
import type { EditorTab } from '../../src/types/editorTab';
import {
  createTabId,
  updateTab,
  withDiskChange,
  withDiskContent,
  withoutDiskChange,
  withSavedSource,
} from '../../src/utils/editorTab';

function tab(overrides: Partial<EditorTab> = {}): EditorTab {
  return {
    id: 'a',
    path: 'C:\\Docs\\note.md',
    source: 'hello',
    savedSource: 'hello',
    diskChange: null,
    docEpoch: 0,
    ...overrides,
  };
}

describe('createTabId', () => {
  it('returns a non-empty id', () => {
    expect(createTabId().length).toBeGreaterThan(0);
  });
});

describe('updateTab', () => {
  it('updates only the matching id', () => {
    const tabs = [tab({ id: 'a' }), tab({ id: 'b', path: 'C:\\Docs\\other.md' })];
    const next = updateTab(tabs, 'a', (item) => ({ ...item, source: 'edited' }));
    expect(next[0]?.source).toBe('edited');
    expect(next[1]?.source).toBe('hello');
  });
});

describe('withSavedSource', () => {
  it('copies source into savedSource', () => {
    expect(withSavedSource(tab({ source: 'draft', savedSource: 'old' })).savedSource).toBe(
      'draft',
    );
  });
});

describe('withDiskContent', () => {
  it('replaces content, clears diskChange, and bumps docEpoch', () => {
    const next = withDiskContent(
      tab({ source: 'local', diskChange: 'modify', docEpoch: 2 }),
      'from-disk',
    );
    expect(next.source).toBe('from-disk');
    expect(next.savedSource).toBe('from-disk');
    expect(next.diskChange).toBeNull();
    expect(next.docEpoch).toBe(3);
  });
});

describe('withoutDiskChange', () => {
  it('clears diskChange only', () => {
    const next = withoutDiskChange(tab({ source: 'local', diskChange: 'remove' }));
    expect(next.diskChange).toBeNull();
    expect(next.source).toBe('local');
  });
});

describe('withDiskChange', () => {
  it('marks matching path and leaves others alone', () => {
    const tabs = [
      tab({ id: 'a', path: 'C:\\Docs\\note.md' }),
      tab({ id: 'b', path: 'C:\\Docs\\other.md' }),
    ];
    const next = withDiskChange(tabs, 'c:/Docs/note.md', 'modify');
    expect(next[0]?.diskChange).toBe('modify');
    expect(next[1]?.diskChange).toBeNull();
  });
});
