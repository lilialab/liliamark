use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

use serde::Serialize;
use tauri::{AppHandle, Manager, State};

/// 冷启动原生侧时间戳（unix ms）；供前端拼不交叉的四段耗时。
pub struct StartupTiming {
    process_started_ms: u64,
    window_visible_ms: Mutex<Option<u64>>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NativeStartupTiming {
    pub process_started_ms: u64,
    pub window_visible_ms: Option<u64>,
}

fn unix_now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

impl StartupTiming {
    pub fn new() -> Self {
        Self {
            process_started_ms: unix_now_ms(),
            window_visible_ms: Mutex::new(None),
        }
    }

    pub fn mark_window_visible(&self) {
        let mut slot = self.window_visible_ms.lock().expect("startup timing lock");
        if slot.is_none() {
            *slot = Some(unix_now_ms());
        }
    }

    fn snapshot(&self) -> NativeStartupTiming {
        NativeStartupTiming {
            process_started_ms: self.process_started_ms,
            window_visible_ms: *self
                .window_visible_ms
                .lock()
                .expect("startup timing lock"),
        }
    }
}

/// 在 AppHandle 上记「窗口/事件循环就绪」（只记一次）。
pub fn mark_window_visible(app: &AppHandle) {
    if let Some(state) = app.try_state::<StartupTiming>() {
        state.mark_window_visible();
    }
}

#[tauri::command]
pub(crate) fn get_native_startup_timing(
    state: State<'_, StartupTiming>,
) -> NativeStartupTiming {
    state.snapshot()
}
