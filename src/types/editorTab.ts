import type { DiskChangeKind } from './diskFileChanged';

export type EditorTab = {
  id: string;
  path: string;
  source: string;
  savedSource: string;
  /** 磁盘相对打开内容有外部变更 */
  diskChange: DiskChangeKind | null;
  /** 从磁盘重载时递增，用来重挂编辑器并清掉相对旧文件的撤销 */
  docEpoch: number;
};
