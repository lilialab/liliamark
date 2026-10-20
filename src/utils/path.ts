function normalizeSeparators(path: string): string {
  return path.replaceAll('/', '\\');
}

function looksLikeWindowsPath(path: string): boolean {
  return /^[a-zA-Z]:\\/.test(path) || path.startsWith('\\\\');
}

/** 判断两条本地路径是否指向同一文件（Windows 下忽略大小写与分隔符） */
export function sameFilePath(a: string, b: string): boolean {
  const left = normalizeSeparators(a);
  const right = normalizeSeparators(b);
  if (looksLikeWindowsPath(left) || looksLikeWindowsPath(right)) {
    return left.toLowerCase() === right.toLowerCase();
  }
  return left === right;
}

/** 从本地路径取出文件名 */
export function fileName(path: string): string {
  const parts = path.split(/[/\\]/);
  return parts.at(-1) || path;
}
