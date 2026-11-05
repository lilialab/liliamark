use dprint_plugin_markdown::configuration::{ConfigurationBuilder, TextWrap};
use dprint_plugin_markdown::format_text as format_markdown_text;
use similar::{capture_diff_slices, Algorithm, DiffOp};
use std::path::Path;

#[derive(Debug, Clone, PartialEq)]
pub struct TextChange {
    pub from: usize,
    pub to: usize,
    pub insert: String,
}

#[derive(Debug, Clone, Copy, PartialEq)]
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
    indent_size: u32,
) -> Result<String, String> {
    match kind {
        FormatKind::Json => format_json(text, indent_size),
        FormatKind::Markdown => format_markdown(text),
    }
}

fn format_json(text: &str, indent_size: u32) -> Result<String, String> {
    let indent = " ".repeat(indent_size.max(1) as usize);
    // 流式 pretty：不建整树，大文件更轻
    let mut formatter = jsonxf::Formatter::pretty_printer();
    formatter.indent = indent;
    formatter.trailing_output = String::from("\n");
    formatter.format(text)
}

fn format_markdown(text: &str) -> Result<String, String> {
    let config = ConfigurationBuilder::new()
        .line_width(80)
        .text_wrap(TextWrap::Maintain)
        .code_block_skip_format(true)
        .build();
    match format_markdown_text(text, &config, |_, _, _| Ok(None)) {
        Ok(Some(formatted)) => Ok(formatted),
        Ok(None) => Ok(text.to_string()),
        Err(error) => Err(error.to_string()),
    }
}

/// 按行切开（保留行尾 `\n`），供行级 Myers 使用。
fn split_lines_inclusive(text: &str) -> Vec<&str> {
    if text.is_empty() {
        return Vec::new();
    }
    text.split_inclusive('\n').collect()
}

fn utf16_len(s: &str) -> usize {
    s.encode_utf16().count()
}

fn lines_utf16_len(lines: &[&str]) -> usize {
    lines.iter().map(|line| utf16_len(line)).sum()
}

/// 相对旧文档的 CM 变更（`from`/`to` 为 UTF-16 码元下标）。
///
/// 按行 Myers：行数远小于码元数，大文档全量 pretty 时不易栈溢出；
/// 行内单字符改动会整行替换（光标仍落在附近）。
pub fn diff_to_changes(old_text: &str, new_text: &str) -> Vec<TextChange> {
    if old_text == new_text {
        return Vec::new();
    }

    let old_lines = split_lines_inclusive(old_text);
    let new_lines = split_lines_inclusive(new_text);
    let ops = capture_diff_slices(Algorithm::Myers, &old_lines[..], &new_lines[..]);

    let mut changes = Vec::new();
    let mut offset = 0usize;

    for op in ops {
        match op {
            DiffOp::Equal {
                old_index,
                new_index: _,
                len,
            } => {
                offset += lines_utf16_len(&old_lines[old_index..old_index + len]);
            }
            DiffOp::Delete {
                old_index,
                old_len,
                new_index: _,
            } => {
                let deleted = lines_utf16_len(&old_lines[old_index..old_index + old_len]);
                changes.push(TextChange {
                    from: offset,
                    to: offset + deleted,
                    insert: String::new(),
                });
                offset += deleted;
            }
            DiffOp::Insert {
                old_index: _,
                new_index,
                new_len,
            } => {
                let insert = new_lines[new_index..new_index + new_len].concat();
                changes.push(TextChange {
                    from: offset,
                    to: offset,
                    insert,
                });
            }
            DiffOp::Replace {
                old_index,
                old_len,
                new_index,
                new_len,
            } => {
                let deleted = lines_utf16_len(&old_lines[old_index..old_index + old_len]);
                let insert = new_lines[new_index..new_index + new_len].concat();
                changes.push(TextChange {
                    from: offset,
                    to: offset + deleted,
                    insert,
                });
                offset += deleted;
            }
        }
    }

    changes
}

pub fn format_and_diff(
    kind: FormatKind,
    text: &str,
    indent_size: u32,
) -> Result<(String, Vec<TextChange>), String> {
    let formatted = format_text(kind, text, indent_size)?;
    let changes = diff_to_changes(text, &formatted);
    Ok((formatted, changes))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn formats_json_with_indent() {
        let out = format_json("{\"a\":1}", 2).unwrap();
        assert_eq!(out, "{\n  \"a\": 1\n}\n");
    }

    #[test]
    fn formats_json_with_four_space_indent() {
        let out = format_json("{\"a\":1}", 4).unwrap();
        assert_eq!(out, "{\n    \"a\": 1\n}\n");
    }

    #[test]
    fn diff_same_returns_empty() {
        assert!(diff_to_changes("a\nb", "a\nb").is_empty());
    }

    #[test]
    fn diff_line_replace_covers_whole_line() {
        // 行级 diff：行内改字整行替换
        let changes = diff_to_changes("abc", "aXc");
        assert_eq!(changes.len(), 1);
        assert_eq!(changes[0].from, 0);
        assert_eq!(changes[0].to, 3);
        assert_eq!(changes[0].insert, "aXc");
    }

    #[test]
    fn diff_keeps_unchanged_prefix_lines() {
        let old = "keep\nold\ntail\n";
        let new = "keep\nnew\ntail\n";
        let changes = diff_to_changes(old, new);
        assert_eq!(changes.len(), 1);
        assert_eq!(changes[0].from, utf16_len("keep\n"));
        assert_eq!(changes[0].to, utf16_len("keep\nold\n"));
        assert_eq!(changes[0].insert, "new\n");
    }

    #[test]
    fn diff_insert_line() {
        let changes = diff_to_changes("a\nc\n", "a\nb\nc\n");
        assert_eq!(changes.len(), 1);
        assert_eq!(changes[0].from, utf16_len("a\n"));
        assert_eq!(changes[0].to, utf16_len("a\n"));
        assert_eq!(changes[0].insert, "b\n");
    }

    #[test]
    fn diff_delete_line() {
        let changes = diff_to_changes("a\nb\nc\n", "a\nc\n");
        assert_eq!(changes.len(), 1);
        assert_eq!(changes[0].from, utf16_len("a\n"));
        assert_eq!(changes[0].to, utf16_len("a\nb\n"));
        assert_eq!(changes[0].insert, "");
    }

    #[test]
    fn diff_surrogate_pair_utf16_offsets() {
        // 😀 为 2 个 UTF-16 码元
        let old = "😀\nx\n";
        let new = "😀\ny\n";
        let changes = diff_to_changes(old, new);
        assert_eq!(changes.len(), 1);
        assert_eq!(changes[0].from, 2 + 1); // emoji + \n
        assert_eq!(changes[0].to, 2 + 1 + 1 + 1); // + "x\n"
        assert_eq!(changes[0].insert, "y\n");
    }

    #[test]
    fn format_kind_detects_extensions() {
        assert_eq!(format_kind_for_path("a.json"), Some(FormatKind::Json));
        assert_eq!(format_kind_for_path("a.MD"), Some(FormatKind::Markdown));
        assert_eq!(format_kind_for_path("a.yaml"), None);
    }

    #[test]
    fn formats_markdown_trims_heading_space() {
        let out = format_markdown("#   Hello  \n").unwrap();
        assert!(out.starts_with("# Hello"));
    }

    #[test]
    fn formats_markdown_nested_list_common_mark_indent() {
        let out = format_markdown("- a\n    - b\n").unwrap();
        assert!(
            out.contains("\n  - b"),
            "expected CommonMark 2-space nest, got:\n{out}"
        );
    }
}

