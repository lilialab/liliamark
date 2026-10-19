use tauri::State;

use crate::open_file::PendingOpenPath;

/// 取出并清空冷启动待打开路径。
#[tauri::command]
pub(crate) fn take_pending_open_path(state: State<'_, PendingOpenPath>) -> Option<String> {
    state.take()
}
