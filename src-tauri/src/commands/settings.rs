use std::fs;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

const SETTINGS_FILE: &str = "settings.json";

#[derive(Debug, Default, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum IndentStyle {
    #[default]
    Space,
    Tab,
}

/// 应用设置；磁盘上始终是完整一份（缺文件 / 坏 JSON 时整份写默认）。
#[derive(Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub font_family: String,
    pub font_size: u32,
    pub indent_style: IndentStyle,
    pub indent_size: u32,
    /// 界面语言：system / zh / en
    pub locale: String,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            font_family: "Consolas, 'Courier New', monospace".into(),
            font_size: 16,
            indent_style: IndentStyle::Space,
            indent_size: 4,
            locale: "system".into(),
        }
    }
}

fn settings_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_config_dir()
        .map_err(|error| error.to_string())?;
    Ok(dir.join(SETTINGS_FILE))
}

/// 完整合法 JSON → Some；缺字段或坏 JSON → None。
fn parse_settings_json(text: &str) -> Option<AppSettings> {
    serde_json::from_str(text).ok()
}

fn write_settings_file(path: &Path, settings: &AppSettings) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }
    let text = serde_json::to_string_pretty(settings).map_err(|error| error.to_string())?;
    fs::write(path, text).map_err(|error| error.to_string())
}

/// 读取设置；无文件或无法解析时写入默认并返回默认。
#[tauri::command]
pub(crate) fn load_app_settings(app: AppHandle) -> Result<AppSettings, String> {
    let path = settings_path(&app)?;

    if let Ok(text) = fs::read_to_string(&path) {
        if let Some(settings) = parse_settings_json(&text) {
            return Ok(settings);
        }
    }

    let defaults = AppSettings::default();
    write_settings_file(&path, &defaults)?;
    Ok(defaults)
}

/// 将设置写入应用配置目录。
#[tauri::command]
pub(crate) fn save_app_settings(app: AppHandle, settings: AppSettings) -> Result<(), String> {
    write_settings_file(&settings_path(&app)?, &settings)
}

#[cfg(test)]
mod tests {
    use super::{parse_settings_json, AppSettings, IndentStyle};

    #[test]
    fn parse_valid_settings() {
        let json = r#"{"fontFamily":"Consolas, monospace","fontSize":18,"indentStyle":"tab","indentSize":2,"locale":"zh"}"#;
        assert_eq!(
            parse_settings_json(json),
            Some(AppSettings {
                font_family: "Consolas, monospace".into(),
                font_size: 18,
                indent_style: IndentStyle::Tab,
                indent_size: 2,
                locale: "zh".into(),
            })
        );
    }

    #[test]
    fn parse_incomplete_or_invalid_is_none() {
        assert_eq!(parse_settings_json(""), None);
        assert_eq!(parse_settings_json("{"), None);
        assert_eq!(parse_settings_json("null"), None);
        assert_eq!(
            parse_settings_json(r#"{"fontFamily":"Consolas","fontSize":18}"#),
            None
        );
    }

    #[test]
    fn default_settings_are_usable() {
        let defaults = AppSettings::default();
        assert_eq!(defaults.font_size, 16);
        assert_eq!(defaults.indent_size, 4);
        assert_eq!(defaults.indent_style, IndentStyle::Space);
        assert_eq!(defaults.locale, "system");
        assert!(!defaults.font_family.is_empty());
    }
}
