/** unknown 错误转可读字符串（toast description 等） */
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
