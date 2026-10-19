mod commands;
mod open_file;

use tauri::Manager;

use commands::fs::{read_text_file, write_text_file};
use commands::launch::take_pending_open_path;
use open_file::{PendingOpenPath, open_path_in_running_app, paths_from_args, remember_open_path};

/// 启动 Tauri：单实例、文件关联打开、注册读写命令。
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default();

    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
            if let Some(path) = paths_from_args(args).into_iter().next() {
                open_path_in_running_app(&app, path);
                return;
            }

            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_focus();
            }
        }));
    }

    builder
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .manage(PendingOpenPath::new())
        .setup(|app| {
            #[cfg(any(windows, target_os = "linux"))]
            {
                if let Some(path) = paths_from_args(std::env::args()).into_iter().next() {
                    remember_open_path(app.handle(), path);
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            take_pending_open_path,
            read_text_file,
            write_text_file
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(
            #[allow(unused_variables)]
            |app, event| {
                #[cfg(any(target_os = "macos", target_os = "ios"))]
                if let tauri::RunEvent::Opened { urls } = event {
                    if let Some(path) = urls
                        .into_iter()
                        .filter_map(|url| url.to_file_path().ok())
                        .next()
                    {
                        open_path_in_running_app(app, path);
                    }
                }
            },
        );
}
