import { describe, expect, it } from 'vitest';
import {
  decodeTextChanges,
  decodeUtf8Buffer,
  encodeFormatRequest,
  encodePathContent,
} from '../../../src/lib/tauri/ipcBytes';

describe('ipcBytes', () => {
  it('encodePathContent prefixes utf-8 path', () => {
    const encoded = encodePathContent('中文.md', 'hi');
    const view = new DataView(encoded.buffer, encoded.byteOffset, encoded.byteLength);
    const pathLen = view.getUint32(0, true);
    const path = new TextDecoder().decode(encoded.subarray(4, 4 + pathLen));
    const content = new TextDecoder().decode(encoded.subarray(4 + pathLen));
    expect(path).toBe('中文.md');
    expect(content).toBe('hi');
  });

  it('encodeFormatRequest keeps content as trailing bytes', () => {
    const encoded = encodeFormatRequest('a.json', 2, '{"a":1}');
    const view = new DataView(encoded.buffer, encoded.byteOffset, encoded.byteLength);
    let offset = 0;
    const pathLen = view.getUint32(offset, true);
    offset += 4 + pathLen;
    expect(view.getUint32(offset, true)).toBe(2);
    offset += 4;
    expect(new TextDecoder().decode(encoded.subarray(offset))).toBe('{"a":1}');
  });

  it('decodeTextChanges reads le frame', () => {
    const insert = new TextEncoder().encode('你好');
    const buf = new Uint8Array(4 + 4 + 4 + 4 + insert.length);
    const view = new DataView(buf.buffer);
    view.setUint32(0, 1, true);
    view.setUint32(4, 10, true);
    view.setUint32(8, 12, true);
    view.setUint32(12, insert.length, true);
    buf.set(insert, 16);
    expect(decodeTextChanges(buf.buffer)).toEqual([{ from: 10, to: 12, insert: '你好' }]);
  });

  it('decodeUtf8Buffer', () => {
    expect(decodeUtf8Buffer(new TextEncoder().encode('abc').buffer)).toBe('abc');
  });
});
