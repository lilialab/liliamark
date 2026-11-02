/** 协议里长度/偏移字段均为小端 u32 */
const U32_BYTES = 4;

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function readUint32(view: DataView, offset: { value: number }): number {
  const value = view.getUint32(offset.value, true);
  offset.value += U32_BYTES;
  return value;
}

function writeUint32(view: DataView, offset: number, value: number): number {
  view.setUint32(offset, value >>> 0, true);
  return offset + U32_BYTES;
}

function readBytes(buf: Uint8Array, offset: { value: number }, len: number): Uint8Array {
  const end = offset.value + len;
  if (end > buf.length) {
    throw new Error('truncated ipc frame');
  }
  const slice = buf.subarray(offset.value, end);
  offset.value = end;
  return slice;
}

function readString(buf: Uint8Array, view: DataView, offset: { value: number }): string {
  const len = readUint32(view, offset);
  return textDecoder.decode(readBytes(buf, offset, len));
}

/** 写文件请求：`path_len | path | content` */
export function encodePathContent(path: string, content: string): Uint8Array {
  const pathBytes = textEncoder.encode(path);
  const contentBytes = textEncoder.encode(content);
  const out = new Uint8Array(U32_BYTES + pathBytes.length + contentBytes.length);
  const view = new DataView(out.buffer);
  let offset = writeUint32(view, 0, pathBytes.length);
  out.set(pathBytes, offset);
  offset += pathBytes.length;
  out.set(contentBytes, offset);
  return out;
}

/** 格式化请求：`path | indent_style | indent_size | content` */
export function encodeFormatRequest(
  path: string,
  indentStyle: string,
  indentSize: number,
  content: string,
): Uint8Array {
  const pathBytes = textEncoder.encode(path);
  const styleBytes = textEncoder.encode(indentStyle);
  const contentBytes = textEncoder.encode(content);
  const out = new Uint8Array(
    U32_BYTES + pathBytes.length + U32_BYTES + styleBytes.length + U32_BYTES + contentBytes.length,
  );
  const view = new DataView(out.buffer);
  let offset = writeUint32(view, 0, pathBytes.length);
  out.set(pathBytes, offset);
  offset += pathBytes.length;
  offset = writeUint32(view, offset, styleBytes.length);
  out.set(styleBytes, offset);
  offset += styleBytes.length;
  offset = writeUint32(view, offset, indentSize);
  out.set(contentBytes, offset);
  return out;
}

export type DecodedTextChange = {
  from: number;
  to: number;
  insert: string;
};

/** 解析格式化响应：`count | (from | to | insert)*` */
export function decodeTextChanges(buffer: ArrayBuffer): DecodedTextChange[] {
  const buf = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const offset = { value: 0 };
  const count = readUint32(view, offset);
  const changes: DecodedTextChange[] = [];
  for (let i = 0; i < count; i++) {
    const from = readUint32(view, offset);
    const to = readUint32(view, offset);
    const insert = readString(buf, view, offset);
    changes.push({ from, to, insert });
  }
  if (offset.value !== buf.length) {
    throw new Error('trailing bytes in changes frame');
  }
  return changes;
}

/** Raw 响应 UTF-8 → 字符串 */
export function decodeUtf8Buffer(buffer: ArrayBuffer): string {
  return textDecoder.decode(buffer);
}
