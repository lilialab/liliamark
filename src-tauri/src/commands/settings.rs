use std::fs;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

const SETTINGS_FILE: &str = "settings.json";

/// 应用设置。加载时：磁盘有的字段保留，缺的用 `Default` 补齐并写回完整 JSON；
/// 无文件或坏 JSON 则整份默认后写回。
#[derive(Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub font_family: String,
    pub font_size: u32,
    /// 空格缩进宽度（仅 2 或 4）
    pub indent_size: u32,
    pub format_on_save: bool,
    /// 窗口失焦时自动保存已落盘脏标签；超大文档与未命名跳过
    pub save_on_blur: bool,
    /// 界面语言：system / zh / en
    pub locale: String,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            font_family: "Consolas, 'Courier New', monospace".into(),
            font_size: 16,
            indent_size: 2,
            format_on_save: false,
            save_on_blur: true,
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

/// 合法 JSON 对象 → 与默认合并后的设置；语法坏 / 非对象 / 字段类型不对 → None。
fn parse_settings_json(text: &str) -> Option<AppSettings> {
    let parsed: serde_json::Value = serde_json::from_str(text).ok()?;
    let obj = parsed.as_object()?;
    let mut merged = serde_json::to_value(AppSettings::default()).ok()?;
    let merged_obj = merged.as_object_mut()?;
    for (key, value) in obj {
        merged_obj.insert(key.clone(), value.clone());
    }
    serde_json::from_value(merged).ok()
}

fn write_settings_file(path: &Path, settings: &AppSettings) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }
    let text = serde_json::to_string_pretty(settings).map_err(|error| error.to_string())?;
    fs::write(path, text).map_err(|error| error.to_string())
}

/// 读取设置；合并缺省后始终写回完整文件。
#[tauri::command]
pub(crate) fn load_app_settings(app: AppHandle) -> Result<AppSettings, String> {
    let path = settings_path(&app)?;
    let settings = match fs::read_to_string(&path) {
        Ok(text) => parse_settings_json(&text).unwrap_or_default(),
        Err(_) => AppSettings::default(),
    };
    write_settings_file(&path, &settings)?;
    Ok(settings)
}

/// 将设置写入应用配置目录。
#[tauri::command]
pub(crate) fn save_app_settings(app: AppHandle, settings: AppSettings) -> Result<(), String> {
    write_settings_file(&settings_path(&app)?, &settings)
}

#[cfg(test)]
mod tests {
    use super::{parse_settings_json, AppSettings};

    #[test]
    fn parse_valid_settings() {
        let json = r#"{"fontFamily":"Consolas, monospace","fontSize":18,"indentSize":4,"formatOnSave":true,"locale":"zh"}"#;
        assert_eq!(
            parse_settings_json(json),
            Some(AppSettings {
                font_family: "Consolas, monospace".into(),
                font_size: 18,
                indent_size: 4,
                format_on_save: true,
                save_on_blur: true,
                locale: "zh".into(),
            })
        );
    }

    #[test]
    fn missing_fields_merge_defaults() {
        let json = r#"{"fontFamily":"Consolas, monospace","fontSize":18,"indentSize":2,"locale":"zh"}"#;
        assert_eq!(
            parse_settings_json(json),
            Some(AppSettings {
                font_family: "Consolas, monospace".into(),
                font_size: 18,
                indent_size: 2,
                format_on_save: false,
                save_on_blur: true,
                locale: "zh".into(),
            })
        );

        let partial = parse_settings_json(r#"{"fontSize":20}"#).expect("partial should merge");
        assert_eq!(partial.font_size, 20);
        assert_eq!(partial.indent_size, AppSettings::default().indent_size);
        assert_eq!(partial.font_family, AppSettings::default().font_family);
        assert!(!partial.format_on_save);
        assert!(partial.save_on_blur);
    }

    #[test]
    fn parse_invalid_is_none() {
        assert_eq!(parse_settings_json(""), None);
        assert_eq!(parse_settings_json("{"), None);
        assert_eq!(parse_settings_json("null"), None);
        assert_eq!(parse_settings_json(r#"{"fontSize":"x"}"#), None);
    }

    #[test]
    fn default_settings_are_usable() {
        let defaults = AppSettings::default();
        assert_eq!(defaults.font_size, 16);
        assert_eq!(defaults.indent_size, 2);
        assert_eq!(defaults.locale, "system");
        assert!(!defaults.format_on_save);
        assert!(defaults.save_on_blur);
        assert!(!defaults.font_family.is_empty());
    }
}
