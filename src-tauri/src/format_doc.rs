use markdown_ppp::parser::{parse_markdown, MarkdownParserState};
use markdown_ppp::printer::{config::Config as MdConfig, render_markdown};
use serde::Serialize;
use serde_json::ser::{PrettyFormatter, Serializer};
use serde_json::Value;
use similar::{capture_diff_slices, Algorithm, DiffOp};
use std::io::Write;
use std::path::Path;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TextChange {
    pub from: usize,
    pub to: usize,
    pub insert: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FormatDocumentResult {
    pub changes: Vec<TextChange>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FormatKind {
    Json,
    Markdown,
}

pub fn format_kind_for_path(path: &str) -> Option<FormatKind> {
    let name = Path::new(path)
        .file_name()
        .and_then(|s| s.to_str())
        .unwrap_or(path);
    let ext = name
        .rsplit_once('.')
        .filter(|(stem, _)| !stem.is_empty())
        .map(|(_, ext)| ext.to_ascii_lowercase())?;
    match ext.as_str() {
        "json" | "jsonc" => Some(FormatKind::Json),
        "md" | "markdown" => Some(FormatKind::Markdown),
        _ => None,
    }
}

pub fn format_text(
    kind: FormatKind,
    text: &str,
    indent_style: &str,
    indent_size: u32,
) -> Result<String, String> {
    match kind {
        FormatKind::Json => format_json(text, indent_style, indent_size),
        FormatKind::Markdown => format_markdown(text, indent_size),
    }
}

fn format_json(text: &str, indent_style: &str, indent_size: u32) -> Result<String, String> {
    let value: Value = serde_json::from_str(text).map_err(|error| error.to_string())?;
    let indent = if indent_style == "tab" {
        "\t".to_string()
    } else {
        " ".repeat(indent_size.max(1) as usize)
    };
    let mut buffer = Vec::new();
    {
        let formatter = PrettyFormatter::with_indent(indent.as_bytes());
        let mut serializer = Serializer::with_formatter(&mut buffer, formatter);
        value
            .serialize(&mut serializer)
            .map_err(|error| error.to_string())?;
    }
    buffer.write_all(b"\n").map_err(|error| error.to_string())?;
    String::from_utf8(buffer).map_err(|error| error.to_string())
}

fn format_markdown(text: &str, indent_size: u32) -> Result<String, String> {
    let state = MarkdownParserState::new();
    let document = parse_markdown(state, text).map_err(|error| error.to_string())?;
    let width = 100u32.saturating_add(indent_size.saturating_mul(4));
    let config = MdConfig::default()
        .with_width(width as usize)
        .with_spaces_before_list_item(0);
    Ok(render_markdown(&document, config))
}

/// 相对旧文档的 CM 变更（`from`/`to` 为 UTF-16 码元下标）。
pub fn diff_to_changes(old_text: &str, new_text: &str) -> Vec<TextChange> {
    if old_text == new_text {
        return Vec::new();
    }

    let old_units: Vec<u16> = old_text.encode_utf16().collect();
    let new_units: Vec<u16> = new_text.encode_utf16().collect();
    let ops = capture_diff_slices(Algorithm::Myers, &old_units[..], &new_units[..]);

    let mut changes = Vec::new();
    let mut offset = 0usize;

    for op in ops {
        match op {
            DiffOp::Equal {
                old_index: _,
                new_index: _,
                len,
            } => {
                offset += len;
            }
            DiffOp::Delete {
                old_index: _,
                old_len,
                new_index: _,
            } => {
                changes.push(TextChange {
                    from: offset,
                    to: offset + old_len,
                    insert: String::new(),
                });
                offset += old_len;
            }
            DiffOp::Insert {
                old_index: _,
                new_index,
                new_len,
            } => {
                let slice = &new_units[new_index..new_index + new_len];
                let insert = String::from_utf16_lossy(slice);
                changes.push(TextChange {
                    from: offset,
                    to: offset,
                    insert,
                });
            }
            DiffOp::Replace {
                old_index: _,
                old_len,
                new_index,
                new_len,
            } => {
                let slice = &new_units[new_index..new_index + new_len];
                let insert = String::from_utf16_lossy(slice);
                changes.push(TextChange {
                    from: offset,
                    to: offset + old_len,
                    insert,
                });
                offset += old_len;
            }
        }
    }

    changes
}

pub fn format_and_diff(
    kind: FormatKind,
    text: &str,
    indent_style: &str,
    indent_size: u32,
) -> Result<(String, Vec<TextChange>), String> {
    let formatted = format_text(kind, text, indent_style, indent_size)?;
    let changes = diff_to_changes(text, &formatted);
    Ok((formatted, changes))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn formats_json_with_indent() {
        let out = format_json("{\"a\":1}", "space", 2).unwrap();
        assert!(out.contains("\n  \"a\": 1\n"));
    }

    #[test]
    fn diff_replace_single_char() {
        let changes = diff_to_changes("abc", "aXc");
        assert_eq!(changes.len(), 1);
        assert_eq!(changes[0].from, 1);
        assert_eq!(changes[0].to, 2);
        assert_eq!(changes[0].insert, "X");
    }

    #[test]
    fn format_kind_detects_extensions() {
        assert_eq!(format_kind_for_path("a.json"), Some(FormatKind::Json));
        assert_eq!(format_kind_for_path("a.MD"), Some(FormatKind::Markdown));
        assert_eq!(format_kind_for_path("a.yaml"), None);
    }
}

