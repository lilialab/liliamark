use serde::Deserialize;

use crate::format_doc::{format_and_diff, format_kind_for_path, FormatDocumentResult};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FormatIndentOptions {
    pub indent_style: String,
    pub indent_size: u32,
}

/// 整份正文格式化 + diff。阻塞池执行，避免卡住 UI 线程。
#[tauri::command]
pub(crate) async fn format_document_text(
    language_path: String,
    content: String,
    options: FormatIndentOptions,
) -> Result<FormatDocumentResult, String> {
    let kind = format_kind_for_path(&language_path)
        .ok_or_else(|| "unsupported format".to_string())?;

    let (_formatted, changes) = tauri::async_runtime::spawn_blocking(move || {
        format_and_diff(
            kind,
            &content,
            &options.indent_style,
            options.indent_size,
        )
    })
    .await
    .map_err(|error| error.to_string())??;

    Ok(FormatDocumentResult { changes })
}
