use std::fs;
use std::path::PathBuf;

use serde::Serialize;
use tauri::State;

use crate::file_watch::FileWatchState;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DropPathsClassification {
    pub files: Vec<String>,
    pub had_directory: bool,
}

/// 把拖入路径分成普通文件；若含目录则标记。
#[tauri::command]
pub(crate) fn classify_drop_paths(paths: Vec<String>) -> DropPathsClassification {
    let mut files = Vec::new();
    let mut had_directory = false;

    for path in paths {
        let path_buf = PathBuf::from(&path);
        if path_buf.is_dir() {
            had_directory = true;
        } else if path_buf.is_file() {
            files.push(path);
        }
    }

    DropPathsClassification {
        files,
        had_directory,
    }
}

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
