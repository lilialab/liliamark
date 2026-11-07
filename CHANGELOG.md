# Changelog

## [Unreleased]

## [0.2.5] — 2026-11-07

### Added

- 未命名空文档首次粘贴：高置信嗅探 JSON / HTML / XML，自动改后缀
- 未命名后缀变更时底栏语言标签 mauve 短闪（同 tab 内变更才触发）

### Changed

- 滚动条改用标准 `scrollbar-width: thin` + `scrollbar-color`（不再用 webkit border 伪装粗细）
- 模态框取消点击遮罩关闭；快捷键页去掉「暂不支持修改」提示

### Notes

- 版本号同步为 `0.2.5`（`package.json` / Tauri / Cargo）

## [0.2.4] — 2026-11-06

### Changed

- 未命名文件类型：去掉右上角浮层；底栏语言可点打开弹框（筛选 / 虚线胶囊添加 / hover 删除 / 恢复默认词表）
- 扩展名词表写入 `settings.json`（`untitledExtensions`）；默认稿 `default_settings.json`，仅保留 CodeMirror 能高亮的常用后缀
- 抽取共用 `errorMessage`；保存失败 toast 统一为标题 + `description`

### Notes

- 版本号同步为 `0.2.4`（`package.json` / Tauri / Cargo）

## [0.2.3] — 2026-11-05

### Added

- 编辑器底栏：语言、缩进、选区字符数、字符数、行数、光标行列（纯展示）
- 设置：可选「失焦时自动保存」（默认开；已落盘且 dirty 的标签；未命名与约 1MB 以上跳过）

### Changed

- 设置：去掉 Tab 缩进；仅空格，单选 2 / 4（默认 2）
- Markdown「格式化文档」改用 `dprint-plugin-markdown`（CommonMark 列表）；JSON 仍用流式 `jsonxf`（缩进跟设置）
- Markdown 预览正文随视口软换行（代码块仍不折、可横滑；图片限制在内容宽内）
- 滚动条：透明轨道、隐藏两端箭头（仅 `::-webkit-scrollbar*`，避免与 `scrollbar-width` 冲突）
- CodeMirror 折叠 / 搜索面板图标改用 `lucide`（非 React），去掉 `react-dom/server`，主包约小 200KB
- 应用设置默认值只保留 Rust；启动时先 hydrate 再挂载 React
- 空工作区提示在会话恢复完成后再显示，避免启动闪字
- 设置页「缩进方式」标题整理（去掉 fieldset legend 换行）

### Notes

- 版本号同步为 `0.2.3`（`package.json` / Tauri / Cargo）

## [0.2.2] — 2026-11-04

### Added

- Windows NSIS 安装包：内置简体中文 / 英文（跟随系统语言）
- 更新提示：启动后检查 GitHub Latest Release；菜单「检查更新」；有新版本 toast 并可打开下载页（不自动安装）
- 设置页展示当前应用版本
- 通用 `AppModal`（`createPortal` 到 `document.body`；标题 + 右上角关闭）；设置 / 快捷键 / Markdown 标记 / 启动耗时 / 确认框共用

### Changed

- 大文档约 1MB 阈值合并为 `LARGE_DOC_MAX_LENGTH`（保存时格式化与搜索匹配计数共用）
- 大文件搜索不再全量统计匹配数（避免卡顿）

### Notes

- 版本号同步为 `0.2.2`（`package.json` / Tauri / Cargo）

## [0.2.1] — 2026-11-02

### Added

- 设置：可选「保存时格式化」（默认关；仅 JSON / Markdown；约 1MB 以上跳过；菜单/快捷键手动格式化不受影响）

### Changed

- 设置加载：缺字段与默认合并后写回完整文件；无文件或坏 JSON 仍整份默认
- 应用菜单：分组与部分项图标；设置单独成组；去掉「格式化文档」菜单项（`Shift+Alt+F` 仍可用）

### Notes

- GitHub release workflow：升级 `actions/checkout`、`actions/setup-node`、`pnpm/action-setup` 主版本，消除 Actions Node 20 弃用警告
- 版本号同步为 `0.2.1`（`package.json` / Tauri / Cargo）

## [0.2.0] — 2026-10-31

### Added

- 源码查找 / 替换（`Ctrl/Cmd+F` 打开 VS Code 风格面板；`Ctrl/Cmd+G` / F3 下一处）
- 代码折叠（行号旁 lucide gutter；JSON 等按语法树）
- 整篇格式化（`Shift+Alt+F`）：JSON / Markdown 经 Rust format + UTF-16 diff 写回
- 打开 / 保存 / 格式化：耗时操作延时 loading toast；格式化与读盘期间禁编辑

### Changed

- 设置：无文件或坏 JSON 时整份写入默认；去掉旧 proseFont/monoFont 迁移
- 拖入打开后聚焦主窗口，避免 WebView 丢焦点

### Removed

- 失焦 / 窗口失焦自动保存

### Notes

- 版本号同步为 `0.2.0`（`package.json` / Tauri / Cargo）

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
