const DEFAULT_DELAY_MS = 200;

/**
 * 延迟执行 show；若在 delay 内调用返回的 cancel，则不展示。
 * show 须返回对应的收起函数（已展示时 cancel 会调用它）。
 */
export function createDelayedShow(
  show: () => () => void,
  delayMs: number = DEFAULT_DELAY_MS,
): () => void {
  let dismiss: (() => void) | undefined;
  const timer = setTimeout(() => {
    dismiss = show();
  }, delayMs);
  return () => {
    clearTimeout(timer);
    dismiss?.();
  };
}
