import { invoke } from '@tauri-apps/api/core';
import type { AppSettings } from '../../types/appSettings';
import type { EditorSession } from '../../types/editorSession';

/** 读取编辑器会话；无文件或坏数据时为空会话 */
export async function loadEditorSession(): Promise<EditorSession> {
  return invoke<EditorSession>('load_editor_session');
}

/** 将编辑器会话写入应用数据目录 */
export async function saveEditorSession(session: EditorSession): Promise<void> {
  await invoke('save_editor_session', { session });
}

/** 读取应用设置；Rust 侧缺字段与默认合并并写回完整文件 */
export async function loadAppSettings(): Promise<AppSettings> {
  return invoke<AppSettings>('load_app_settings');
}

/** 将应用设置写入应用配置目录（app_config_dir） */
export async function saveAppSettings(settings: AppSettings): Promise<void> {
  await invoke('save_app_settings', { settings });
}

/** 内置默认设置（不读写磁盘） */
export async function defaultAppSettings(): Promise<AppSettings> {
  return invoke<AppSettings>('default_app_settings');
}
