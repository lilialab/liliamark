# Changelog

## [Unreleased]

### Added

- 源码查找 / 替换（`Ctrl/Cmd+F` 打开 VS Code 风格面板；`Ctrl/Cmd+G` / F3 下一处）

## [0.1.2] — 2026-10-28

### Added

- 任务列表快捷键：`Alt+Enter` 切换当前行 `[ ]` / `[x]`
- 新建未命名标签（`Ctrl/Cmd+N` / 菜单）；可改后缀（Tab 补全 + 幽灵提示），默认 Markdown
- 另存为（菜单 / `Ctrl/Cmd+Shift+S`）；未命名保存时走另存为
- 应用内未保存确认框（关闭标签 / 退出）：保存、不保存、关闭

### Changed

- 未保存确认不再使用系统对话框
- 标签栏去掉键盘排序，避免 Tab 在标签间循环聚焦
- 新建 / 打开后编辑区自动聚焦

### Notes

- 版本号同步为 `0.1.2`（`package.json` / Tauri / Cargo）

## [0.1.1] — 2026-10-27

### Added

- 应用内帮助：Markdown 常用标记、快捷键说明（菜单入口）
- 界面中英国际化（跟随系统，可在设置中切换）
- 失焦 / 窗口失焦自动保存
- 预览开合动画（可打断；Material 减速曲线）
- 空状态与快捷键说明中提示 `Shift+滚轮` 横向滚动
- 双语 README（`README.md` / `README.zh-CN.md`）

### Changed

- Toast 仅保留错误提示；位置改为顶部居中
- 标签拖拽排序时宽度更稳定（避免 scale 挤压）

### Notes

- 版本号同步为 `0.1.1`（`package.json` / Tauri / Cargo）

## [0.1.0] — 2026-10-26

首发版本。详见当时 Releases 说明。
