import { getNativeStartupTiming } from '../lib/tauri/startupTiming';

const PREFIX = 'liliamark:';

const WALL_MARKS = ['script-start', 'ui-ready', 'session-done'] as const;
type WallMark = (typeof WALL_MARKS)[number];

let uiReadyMarked = false;
let reported = false;

/** 最近一次冷启动汇总（设置页临时展示） */
export type StartupTimingRow = {
  label: string;
  meaning: string;
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

  let processMs = scriptMs;
  let windowMs = scriptMs;
  try {
    const native = await getNativeStartupTiming();
    processMs = native.processStartedMs;
    windowMs = native.windowVisibleMs ?? scriptMs;
  } catch {
    // Browser / non-tauri：从 script-start 起算后两段
  }

  // 按时间序钳制，避免时钟抖动出现负值
  const t0 = processMs;
  const t1 = Math.max(windowMs, t0);
  const t2 = Math.max(scriptMs, t1);
  const t3 = Math.max(uiMs, t2);
  const t4 = Math.max(sessionMs, t3);

  lastStartupTiming = [
    {
      label: '进程→窗口',
      meaning: '原生启动到窗口可见',
      durationMs: gapMs(t0, t1),
    },
    {
      label: '窗口→脚本',
      meaning: 'WebView / 前端资源加载',
      durationMs: gapMs(t1, t2),
    },
    {
      label: '脚本→界面',
      meaning: 'React 主界面首挂',
      durationMs: gapMs(t2, t3),
    },
    {
      label: '界面→可用',
      meaning: '会话恢复等到可编辑',
      durationMs: gapMs(t3, t4),
    },
    {
      label: '总耗时',
      meaning: '进程启动到可用',
      durationMs: gapMs(t0, t4),
    },
  ];

  console.warn(
    '[startup]',
    Object.fromEntries(
      lastStartupTiming.map((row) => [row.label, `${row.durationMs}ms`]),
    ),
  );
}
