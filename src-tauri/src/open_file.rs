use std::path::PathBuf;
use std::sync::Mutex;

use tauri::{AppHandle, Emitter, Manager};

/// 冷启动时由系统传入、待前端取走的打开路径。
pub(crate) struct PendingOpenPath(Mutex<Option<String>>);

impl PendingOpenPath {
    pub(crate) fn new() -> Self {
        Self(Mutex::new(None))
    }

    pub(crate) fn set(&self, path: String) {
        if let Ok(mut pending) = self.0.lock() {
            *pending = Some(path);
        }
    }

    pub(crate) fn take(&self) -> Option<String> {
        self.0.lock().ok().and_then(|mut pending| pending.take())
    }
}

/// 把单个命令行参数转成文件路径；flag 或非法值返回 None。
fn arg_to_path(arg: &str) -> Option<PathBuf> {
    if arg.starts_with('-') {
        return None;
    }

    if arg.starts_with("file:") {
        return url::Url::parse(arg)
            .ok()
            .and_then(|parsed| parsed.to_file_path().ok());
    }

    Some(PathBuf::from(arg))
}

/// 从启动参数里收集文件路径（跳过 argv[0] 程序自身）。
pub(crate) fn paths_from_args(args: impl IntoIterator<Item = String>) -> Vec<PathBuf> {
    args.into_iter()
        .skip(1)
        .filter_map(|arg| arg_to_path(&arg))
        .collect()
}

/// 记下待打开路径，供前端启动后一次性取出。
pub(crate) fn remember_open_path(app: &AppHandle, path: PathBuf) {
    let path = path.to_string_lossy().into_owned();
    app.state::<PendingOpenPath>().set(path);
}

/// 应用已在运行时打开文件：写入待取路径、通知前端并聚焦主窗口。
pub(crate) fn open_path_in_running_app(app: &AppHandle, path: PathBuf) {
    let path_string = path.to_string_lossy().into_owned();
    app.state::<PendingOpenPath>().set(path_string.clone());
    let _ = app.emit("open-file", &path_string);
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.set_focus();
    }
}
