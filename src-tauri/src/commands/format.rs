use tauri::ipc::{InvokeBody, Request, Response};

use crate::format_doc::{format_and_diff, format_kind_for_path};
use crate::ipc_bytes::{decode_format_request, encode_text_changes};

/// 整份正文格式化 + diff。请求/响应均为 Raw 字节。阻塞池执行，避免卡住 UI 线程。
#[tauri::command]
pub(crate) async fn format_document_text(request: Request<'_>) -> Result<Response, String> {
    let InvokeBody::Raw(raw) = request.body() else {
        return Err("expected raw body".to_string());
    };
    let req = decode_format_request(raw)?;
    let kind = format_kind_for_path(&req.path).ok_or_else(|| "unsupported format".to_string())?;

    let changes = tauri::async_runtime::spawn_blocking(move || {
        let (_formatted, changes) =
            format_and_diff(kind, &req.content, &req.indent_style, req.indent_size)?;
        encode_text_changes(&changes)
    })
    .await
    .map_err(|error| error.to_string())??;

    Ok(Response::new(changes))
}
