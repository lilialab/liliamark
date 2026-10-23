import type { DiskChangeKind } from './diskFileChanged';

export type EditorTab = {
  id: string;
  path: string;
  /** 相对上次保存/打开是否有未保存编辑（改回原文也可能仍为 true，后续再优化） */
  dirty: boolean;
  /** 磁盘相对打开内容有外部变更 */
  diskChange: DiskChangeKind | null;
  /** 从磁盘重载时递增，用来重挂编辑器并清掉相对旧文件的撤销 */
  docEpoch: number;
};
