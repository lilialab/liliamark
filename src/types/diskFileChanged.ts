export type DiskChangeKind = 'modify' | 'remove';

export type DiskFileChanged = {
  path: string;
  kind: DiskChangeKind;
};
