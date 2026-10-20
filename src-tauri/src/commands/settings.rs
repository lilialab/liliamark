use std::fs;
use std::path::PathBuf;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

const SETTINGS_FILE: &str = "settings.json";

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    #[serde(default)]
    pub font_family: String,
}

/// 旧版双字段；仅用于读入迁移。
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct LegacyAppSettings {
    #[serde(default)]
    font_family: String,
    #[serde(default)]
    prose_font: String,
    #[serde(default)]
    mono_font: String,
}

fn empty_settings() -> AppSettings {
    AppSettings {
        font_family: String::new(),
    }
}

fn settings_from_legacy(legacy: LegacyAppSettings) -> AppSettings {
    let font_family = [legacy.font_family, legacy.mono_font, legacy.prose_font]
        .into_iter()
        .find(|value| !value.trim().is_empty())
        .unwrap_or_default();
    AppSettings { font_family }
}

fn settings_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_config_dir()
        .map_err(|error| error.to_string())?;
    Ok(dir.join(SETTINGS_FILE))
}

/// 解析设置 JSON；缺失字段或非法内容视为空设置。兼容旧 proseFont/monoFont。
fn parse_settings_json(text: &str) -> AppSettings {
    serde_json::from_str::<LegacyAppSettings>(text)
        .map(settings_from_legacy)
        .unwrap_or_else(|_| empty_settings())
}

/// 从应用配置目录读取设置；无文件或坏 JSON 时返回空设置。
#[tauri::command]
pub(crate) fn load_app_settings(app: AppHandle) -> Result<AppSettings, String> {
    let path = settings_path(&app)?;
    if !path.is_file() {
        return Ok(empty_settings());
    }

    match fs::read_to_string(&path) {
        Ok(text) => Ok(parse_settings_json(&text)),
        Err(_) => Ok(empty_settings()),
    }
}

/// 将设置写入应用配置目录。
#[tauri::command]
pub(crate) fn save_app_settings(app: AppHandle, settings: AppSettings) -> Result<(), String> {
    let path = settings_path(&app)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }

    let text = serde_json::to_string_pretty(&settings).map_err(|error| error.to_string())?;
    fs::write(&path, text).map_err(|error| error.to_string())
}

#[cfg(test)]
mod tests {
    use super::{empty_settings, parse_settings_json, AppSettings};

    #[test]
    fn parse_valid_settings() {
        let json = r#"{"fontFamily":"Consolas, monospace"}"#;
        assert_eq!(
            parse_settings_json(json),
            AppSettings {
                font_family: "Consolas, monospace".into(),
            }
        );
    }

    #[test]
    fn parse_legacy_mono_font() {
        let json = r#"{"proseFont":"","monoFont":"Cascadia Code, monospace"}"#;
        assert_eq!(
            parse_settings_json(json),
            AppSettings {
                font_family: "Cascadia Code, monospace".into(),
            }
        );
    }

    #[test]
    fn parse_invalid_or_empty_yields_empty_settings() {
        assert_eq!(parse_settings_json(""), empty_settings());
        assert_eq!(parse_settings_json("{"), empty_settings());
        assert_eq!(parse_settings_json("null"), empty_settings());
    }
}
