import type { SearchQuery } from '@codemirror/search';
import type { EditorState } from '@codemirror/state';

export type SearchMatchPosition = {
  /** 匹配总数；触顶时为 limit */
  total: number;
  /** 当前选区对应的 1-based 序号；无则 0 */
  current: number;
  /** 是否因 limit 提前停扫 */
  capped: boolean;
};

const DEFAULT_LIMIT = 9999;

/**
 * 统计查询匹配，并定位光标落在第几个（用于面板「3 / 12」）。
 * 大文档触顶后 `capped` 为 true。
 */
export function locateSearchMatches(
  state: EditorState,
  query: SearchQuery,
  cursorPos: number,
  limit: number = DEFAULT_LIMIT,
): SearchMatchPosition {
  if (!query.valid) {
    return { total: 0, current: 0, capped: false };
  }

  let total = 0;
  let current = 0;
  let capped = false;
  const cursor = query.getCursor(state);

  for (let step = cursor.next(); !step.done; step = cursor.next()) {
    total += 1;
    const { from, to } = step.value;
    if (current === 0 && cursorPos >= from && cursorPos <= to) {
      current = total;
    }
    if (total >= limit) {
      capped = true;
      break;
    }
  }

  return { total, current, capped };
}
