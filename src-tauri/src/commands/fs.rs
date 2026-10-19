use std::fs;
use std::path::PathBuf;

/// 按路径读取文本文件。
#[tauri::command]
pub(crate) fn read_text_file(path: String) -> Result<String, String> {
    let path = PathBuf::from(path);
    fs::read_to_string(&path).map_err(|error| error.to_string())
}

/// 按路径写入文本文件。
#[tauri::command]
pub(crate) fn write_text_file(path: String, content: String) -> Result<(), String> {
    let path = PathBuf::from(path);
    fs::write(&path, content).map_err(|error| error.to_string())
}
