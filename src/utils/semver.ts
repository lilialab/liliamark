/** 去掉常见前缀后解析 major.minor.patch；失败返回 null */
export function parseSemver(raw: string): [number, number, number] | null {
  const trimmed = raw.trim().replace(/^[vV]/, '');
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(trimmed);
  if (!match) {
    return null;
  }
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/** `candidate` 是否严格新于 `current`（仅比三段数字；解析失败视为不新） */
export function isNewerSemver(candidate: string, current: string): boolean {
  const a = parseSemver(candidate);
  const b = parseSemver(current);
  if (!a || !b) {
    return false;
  }
  for (let i = 0; i < 3; i += 1) {
    if (a[i] !== b[i]) {
      return a[i] > b[i];
    }
  }
  return false;
}
