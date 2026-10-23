import { describe, expect, it } from 'vitest';
import type { EditorTab } from '../../src/types/editorTab';
import {
  createTabId,
  updateTab,
  withDiskChange,
  withDiskReload,
  withoutDiskChange,
  withSaved,
} from '../../src/utils/editorTab';

function tab(overrides: Partial<EditorTab> = {}): EditorTab {
  return {
    id: 'a',
    path: 'C:\\Docs\\note.md',
    dirty: false,
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
    const next = updateTab(tabs, 'a', (item) => ({ ...item, dirty: true }));
    expect(next[0]?.dirty).toBe(true);
    expect(next[1]?.dirty).toBe(false);
  });
});

describe('withSaved', () => {
  it('clears dirty', () => {
    expect(withSaved(tab({ dirty: true })).dirty).toBe(false);
  });
});

describe('withDiskReload', () => {
  it('clears dirty and diskChange, and bumps docEpoch', () => {
    const next = withDiskReload(tab({ dirty: true, diskChange: 'modify', docEpoch: 2 }));
    expect(next.dirty).toBe(false);
    expect(next.diskChange).toBeNull();
    expect(next.docEpoch).toBe(3);
  });
});

describe('withoutDiskChange', () => {
  it('clears diskChange only', () => {
    const next = withoutDiskChange(tab({ diskChange: 'remove' }));
    expect(next.diskChange).toBeNull();
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
