import { getNativeStartupTiming } from '../lib/tauri/startupTiming';

const PREFIX = 'liliamark:';

const WALL_MARKS = ['script-start', 'ui-ready', 'session-done'] as const;
type WallMark = (typeof WALL_MARKS)[number];

let uiReadyMarked = false;
let reported = false;

export type StartupTimingId =
  | 'processToWindow'
  | 'windowToScript'
  | 'scriptToUi'
  | 'uiToReady'
  | 'total';

/** 最近一次冷启动汇总（启动耗时页展示；文案在 i18n） */
export type StartupTimingRow = {
  id: StartupTimingId;
  durationMs: number;
};

let lastStartupTiming: StartupTimingRow[] = [];
const wallMs: Partial<Record<WallMark, number>> = {};

function isWallMark(name: string): name is WallMark {
  return (WALL_MARKS as readonly string[]).includes(name);
}

/** 冷启动标记；关键节点同时记 Date.now 以便与原生时间戳拼接 */
export function startupMark(name: string) {
  performance.mark(`${PREFIX}${name}`);
  if (isWallMark(name) && wallMs[name] === undefined) {
    wallMs[name] = Date.now();
  }
}

/** EditorScreen 首挂：只记一次（避开 StrictMode 双调用） */
export function markStartupUiReady() {
  if (uiReadyMarked) {
    return;
  }
  uiReadyMarked = true;
  startupMark('ui-ready');
}

/** 本次冷启动已汇总的耗时行 */
export function getLastStartupTiming(): StartupTimingRow[] {
  return lastStartupTiming;
}

function gapMs(from: number, to: number): number {
  return Math.max(0, Math.round(to - from));
}

/** 汇总四段不交叉耗时 + 总耗时（控制台 + 设置页） */
export async function reportStartupTiming() {
  if (reported) {
    return;
  }
  reported = true;

  const scriptMs = wallMs['script-start'];
  const uiMs = wallMs['ui-ready'];
  const sessionMs = wallMs['session-done'];
  if (scriptMs === undefined || uiMs === undefined || sessionMs === undefined) {
    return;
  }

  const native = await getNativeStartupTiming();
  const processMs = native.processStartedMs;
  const windowMs = native.windowVisibleMs ?? scriptMs;

  // 按时间序钳制，避免时钟抖动出现负值
  const t0 = processMs;
  const t1 = Math.max(windowMs, t0);
  const t2 = Math.max(scriptMs, t1);
  const t3 = Math.max(uiMs, t2);
  const t4 = Math.max(sessionMs, t3);

  lastStartupTiming = [
    { id: 'processToWindow', durationMs: gapMs(t0, t1) },
    { id: 'windowToScript', durationMs: gapMs(t1, t2) },
    { id: 'scriptToUi', durationMs: gapMs(t2, t3) },
    { id: 'uiToReady', durationMs: gapMs(t3, t4) },
    { id: 'total', durationMs: gapMs(t0, t4) },
  ];

  console.warn(
    '[startup]',
    Object.fromEntries(
      lastStartupTiming.map((row) => [row.id, `${row.durationMs}ms`]),
    ),
  );
}
