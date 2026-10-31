import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDelayedShow } from '../../src/utils/delayedShow';

describe('createDelayedShow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not show when cancelled before delay', () => {
    const dismiss = vi.fn();
    const show = vi.fn(() => dismiss);
    const cancel = createDelayedShow(show, 200);
    cancel();
    vi.advanceTimersByTime(200);
    expect(show).not.toHaveBeenCalled();
    expect(dismiss).not.toHaveBeenCalled();
  });

  it('shows after delay and dismisses on cancel', () => {
    const dismiss = vi.fn();
    const show = vi.fn(() => dismiss);
    const cancel = createDelayedShow(show, 200);
    vi.advanceTimersByTime(200);
    expect(show).toHaveBeenCalledOnce();
    cancel();
    expect(dismiss).toHaveBeenCalledOnce();
  });
});
