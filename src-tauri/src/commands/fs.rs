use std::fs;
use std::path::PathBuf;

use tauri::State;

use crate::file_watch::FileWatchState;

/// 按路径读取文本文件。
#[tauri::command]
pub(crate) fn read_text_file(path: String) -> Result<String, String> {
    let path = PathBuf::from(path);
    fs::read_to_string(&path).map_err(|error| error.to_string())
}

/// 按路径写入文本文件。
#[tauri::command]
pub(crate) fn write_text_file(
    path: String,
    content: String,
    watch: State<'_, FileWatchState>,
) -> Result<(), String> {
    let path_buf = PathBuf::from(&path);
    fs::write(&path_buf, content).map_err(|error| error.to_string())?;
    watch.note_self_write(&path);
    Ok(())
}
