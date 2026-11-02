use std::fs;
use std::path::PathBuf;

use serde::Serialize;
use tauri::ipc::{InvokeBody, Request, Response};
use tauri::State;

use crate::file_watch::FileWatchState;
use crate::ipc_bytes::decode_path_content;

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

/// 按路径读取文本文件；响应为 UTF-8 Raw 字节。阻塞池执行，避免卡住 IPC 主线程。
#[tauri::command]
pub(crate) async fn read_text_file(path: String) -> Result<Response, String> {
    let bytes = tauri::async_runtime::spawn_blocking(move || {
        let path = PathBuf::from(path);
        let bytes = fs::read(&path).map_err(|error| error.to_string())?;
        std::str::from_utf8(&bytes).map_err(|error| error.to_string())?;
        Ok::<Vec<u8>, String>(bytes)
    })
    .await
    .map_err(|error| error.to_string())??;

    Ok(Response::new(bytes))
}

/// 按路径写入文本文件；请求 body 为 `path | content` Raw 字节。阻塞池执行，避免卡住 IPC 主线程。
#[tauri::command]
pub(crate) async fn write_text_file(
    request: Request<'_>,
    watch: State<'_, FileWatchState>,
) -> Result<(), String> {
    let InvokeBody::Raw(raw) = request.body() else {
        return Err("expected raw body".to_string());
    };
    let (path, content) = decode_path_content(raw)?;
    let content = content.to_vec();
    let path_for_watch = path.clone();

    watch.begin_self_write(&path_for_watch);
    let write_result = tauri::async_runtime::spawn_blocking(move || {
        fs::write(PathBuf::from(&path), content).map_err(|error| error.to_string())
    })
    .await
    .map_err(|error| error.to_string())
    .and_then(|result| result);
    watch.end_self_write(&path_for_watch);
    write_result
}
