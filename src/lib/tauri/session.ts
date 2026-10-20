import { invoke } from '@tauri-apps/api/core';
import type { EditorSession } from '../../types/editorSession';

/** 读取编辑器会话；无文件或坏数据时为空会话 */
export async function loadEditorSession(): Promise<EditorSession> {
  return invoke<EditorSession>('load_editor_session');
}

/** 将编辑器会话写入应用数据目录 */
export async function saveEditorSession(session: EditorSession): Promise<void> {
  await invoke('save_editor_session', { session });
}
