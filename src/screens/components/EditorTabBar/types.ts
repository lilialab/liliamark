export type EditorTabBarItem = {
  id: string;
  title: string;
  dirty: boolean;
  /** 非当前 tab 的磁盘变更标记；当前 tab 的说明在横幅上 */
  diskChange: boolean;
};
