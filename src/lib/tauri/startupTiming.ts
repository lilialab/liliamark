import { invoke } from '@tauri-apps/api/core';

export type NativeStartupTiming = {
  processStartedMs: number;
  windowVisibleMs: number | null;
};

/** 读取冷启动原生侧 unix 毫秒时间戳 */
export async function getNativeStartupTiming(): Promise<NativeStartupTiming> {
  return invoke<NativeStartupTiming>('get_native_startup_timing');
}
