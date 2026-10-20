const PREFIX = 'liliamark:';

let uiReadyMarked = false;
let reported = false;

/** 冷启动 User Timing 标记 */
export function startupMark(name: string) {
  performance.mark(`${PREFIX}${name}`);
}

/** EditorScreen 首挂：只记一次（避开 StrictMode 双调用） */
export function markStartupUiReady() {
  if (uiReadyMarked) {
    return;
  }
  uiReadyMarked = true;
  startupMark('ui-ready');
}

/** 汇总 script→ui / ui→session 等到控制台 */
export function reportStartupTiming() {
  if (reported) {
    return;
  }
  reported = true;

  measure('script→ui', 'script-start', 'ui-ready');
  measure('session', 'session-start', 'session-done');
  measure('script→session', 'script-start', 'session-done');

  const rows = performance
    .getEntriesByType('measure')
    .filter((entry) => entry.name.startsWith(PREFIX))
    .map((entry) => [
      entry.name.slice(PREFIX.length),
      `${Math.round(entry.duration)}ms`,
    ]);

  console.warn('[startup]', Object.fromEntries(rows));
}

function measure(name: string, start: string, end: string) {
  try {
    performance.measure(`${PREFIX}${name}`, `${PREFIX}${start}`, `${PREFIX}${end}`);
  } catch {
    // 缺 mark 时跳过（例如浏览器预览未跑会话）
  }
}
