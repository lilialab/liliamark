use crate::format_doc::TextChange;

fn read_u32(buf: &[u8], pos: &mut usize) -> Result<u32, String> {
    let end = pos
        .checked_add(4)
        .filter(|end| *end <= buf.len())
        .ok_or_else(|| "truncated ipc frame".to_string())?;
    let value = u32::from_le_bytes(buf[*pos..end].try_into().unwrap());
    *pos = end;
    Ok(value)
}

fn read_slice<'a>(buf: &'a [u8], pos: &mut usize, len: usize) -> Result<&'a [u8], String> {
    let end = pos
        .checked_add(len)
        .filter(|end| *end <= buf.len())
        .ok_or_else(|| "truncated ipc frame".to_string())?;
    let slice = &buf[*pos..end];
    *pos = end;
    Ok(slice)
}

fn read_string(buf: &[u8], pos: &mut usize) -> Result<String, String> {
    let len = read_u32(buf, pos)? as usize;
    let bytes = read_slice(buf, pos, len)?;
    String::from_utf8(bytes.to_vec()).map_err(|error| error.to_string())
}

fn push_u32(out: &mut Vec<u8>, value: u32) {
    out.extend_from_slice(&value.to_le_bytes());
}

fn push_str(out: &mut Vec<u8>, value: &str) {
    let len = u32::try_from(value.len()).expect("string longer than u32::MAX");
    push_u32(out, len);
    out.extend_from_slice(value.as_bytes());
}

fn usize_as_u32(value: usize) -> Result<u32, String> {
    u32::try_from(value).map_err(|_| "offset exceeds u32".to_string())
}

/// 写文件请求：`u32 path_len | path UTF-8 | content 字节`（小端）。
pub fn decode_path_content(buf: &[u8]) -> Result<(String, &[u8]), String> {
    let mut pos = 0;
    let path = read_string(buf, &mut pos)?;
    Ok((path, &buf[pos..]))
}

/// 格式化请求解码结果。
pub struct FormatRequest {
    pub path: String,
    pub indent_size: u32,
    pub content: String,
}

/// 格式化请求：`path | indent_size(u32) | content`（path 为 `u32 len` + UTF-8，小端）。
pub fn decode_format_request(buf: &[u8]) -> Result<FormatRequest, String> {
    let mut pos = 0;
    let path = read_string(buf, &mut pos)?;
    let indent_size = read_u32(buf, &mut pos)?;
    let content = String::from_utf8(buf[pos..].to_vec()).map_err(|error| error.to_string())?;
    Ok(FormatRequest {
        path,
        indent_size,
        content,
    })
}

/// 格式化响应：`count | (from | to | insert_len | insert)*`，from/to 为 UTF-16 下标。
pub fn encode_text_changes(changes: &[TextChange]) -> Result<Vec<u8>, String> {
    let mut out = Vec::new();
    push_u32(&mut out, usize_as_u32(changes.len())?);
    for change in changes {
        push_u32(&mut out, usize_as_u32(change.from)?);
        push_u32(&mut out, usize_as_u32(change.to)?);
        push_str(&mut out, &change.insert);
    }
    Ok(out)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn encode_path_content(path: &str, content: &str) -> Vec<u8> {
        let mut out = Vec::with_capacity(4 + path.len() + content.len());
        push_str(&mut out, path);
        out.extend_from_slice(content.as_bytes());
        out
    }

    fn encode_format_request(path: &str, indent_size: u32, content: &str) -> Vec<u8> {
        let mut out = Vec::with_capacity(4 + path.len() + 4 + content.len());
        push_str(&mut out, path);
        push_u32(&mut out, indent_size);
        out.extend_from_slice(content.as_bytes());
        out
    }

    fn decode_text_changes(buf: &[u8]) -> Result<Vec<TextChange>, String> {
        let mut pos = 0;
        let count = read_u32(buf, &mut pos)? as usize;
        let mut changes = Vec::with_capacity(count);
        for _ in 0..count {
            let from = read_u32(buf, &mut pos)? as usize;
            let to = read_u32(buf, &mut pos)? as usize;
            let insert = read_string(buf, &mut pos)?;
            changes.push(TextChange { from, to, insert });
        }
        if pos != buf.len() {
            return Err("trailing bytes in changes frame".to_string());
        }
        Ok(changes)
    }

    #[test]
    fn path_content_roundtrip() {
        let encoded = encode_path_content("D:\\中文\\a.md", "hello\n");
        let (path, content) = decode_path_content(&encoded).unwrap();
        assert_eq!(path, "D:\\中文\\a.md");
        assert_eq!(content, b"hello\n");
    }

    #[test]
    fn format_request_roundtrip() {
        let encoded = encode_format_request("a.json", 2, "{\"a\":1}");
        let req = decode_format_request(&encoded).unwrap();
        assert_eq!(req.path, "a.json");
        assert_eq!(req.indent_size, 2);
        assert_eq!(req.content, "{\"a\":1}");
    }

    #[test]
    fn text_changes_roundtrip() {
        let changes = vec![
            TextChange {
                from: 0,
                to: 3,
                insert: "你好".to_string(),
            },
            TextChange {
                from: 10,
                to: 10,
                insert: String::new(),
            },
        ];
        let encoded = encode_text_changes(&changes).unwrap();
        assert_eq!(decode_text_changes(&encoded).unwrap(), changes);
    }
}
