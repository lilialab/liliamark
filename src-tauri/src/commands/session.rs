use std::fs;
use std::path::PathBuf;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

const SESSION_FILE: &str = "session.json";

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EditorSession {
    #[serde(default)]
    pub paths: Vec<String>,
    #[serde(default)]
    pub active_path: Option<String>,
}

fn empty_session() -> EditorSession {
    EditorSession {
        paths: Vec::new(),
        active_path: None,
    }
}

fn session_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?;
    Ok(dir.join(SESSION_FILE))
}

/// 解析会话 JSON；缺失字段或非法内容视为空会话。
fn parse_session_json(text: &str) -> EditorSession {
    serde_json::from_str(text).unwrap_or_else(|_| empty_session())
}

/// 从应用数据目录读取编辑器会话；无文件或坏 JSON 时返回空会话。
#[tauri::command]
pub(crate) fn load_editor_session(app: AppHandle) -> Result<EditorSession, String> {
    let path = session_path(&app)?;
    if !path.is_file() {
        return Ok(empty_session());
    }

    match fs::read_to_string(&path) {
        Ok(text) => Ok(parse_session_json(&text)),
        Err(_) => Ok(empty_session()),
    }
}

/// 将编辑器会话写入应用数据目录。
#[tauri::command]
pub(crate) fn save_editor_session(app: AppHandle, session: EditorSession) -> Result<(), String> {
    let path = session_path(&app)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }

    let text = serde_json::to_string_pretty(&session).map_err(|error| error.to_string())?;
    fs::write(&path, text).map_err(|error| error.to_string())
}

#[cfg(test)]
mod tests {
    use super::{empty_session, parse_session_json, EditorSession};

    #[test]
    fn parse_valid_session() {
        let json = r#"{"paths":["a.md","b.md"],"activePath":"b.md"}"#;
        assert_eq!(
            parse_session_json(json),
            EditorSession {
                paths: vec!["a.md".into(), "b.md".into()],
                active_path: Some("b.md".into()),
            }
        );
    }

    #[test]
    fn parse_invalid_or_empty_yields_empty_session() {
        assert_eq!(parse_session_json(""), empty_session());
        assert_eq!(parse_session_json("{"), empty_session());
        assert_eq!(parse_session_json("null"), empty_session());
    }
}
