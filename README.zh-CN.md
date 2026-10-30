# LiliaMark

[English](README.md) | 简体中文

跨平台本地 Markdown / 文本编辑器。源码高亮编辑，快捷键切换预览；基于 Tauri 2，使用系统 WebView，不打包 Chromium。

<!-- 有截图后放到这里，例如：![LiliaMark](docs/screenshot.png) -->

## 功能

- 打开、编辑、保存本地文本（Markdown、JSON、YAML、TOML、HTML 等）
- CodeMirror 源码高亮；多标签，可拖拽排序
- `Ctrl/Cmd+E` 预览：Markdown 应用内渲染；HTML 一键用系统浏览器打开（不内嵌执行脚本）
- GFM 任务列表只读展示；失焦 / 窗口失焦自动保存
- 记住上次打开的文件；支持系统「打开方式」
- 界面主题：Catppuccin Macchiato；界面语言跟随系统（可在设置中改为中文 / English）

当前不做：富文本工具栏、目录树、滚动同步、KaTeX / Mermaid、账号与同步。

## 安装

从仓库 **Releases** 页下载对应平台安装包：

| 系统 | 推荐文件 |
|------|----------|
| Windows | `*_x64-setup.exe` 或 `*_x64_en-US.msi` |
| macOS（Apple Silicon） | `*_aarch64.dmg` |
| macOS（Intel） | `*_x64.dmg` |
| Linux（Debian / Ubuntu） | `*_amd64.deb` 或 AppImage |
| Linux（Fedora 等） | `*.rpm` |

构建默认**未代码签名**：Windows 可能出现 SmartScreen；macOS 首次可能需右键 → 打开。

## 使用

- `Ctrl/Cmd+S` 保存 · `Ctrl/Cmd+E` 预览 · `Ctrl/Cmd+F` 查找 / 替换 · `Ctrl/Cmd+W` 关标签 · `Ctrl/Cmd+Q` 关窗口
- 代码折叠（行号旁 gutter；JSON 等按语法）
- `Shift+滚轮` 横向滚动（编辑区不自动换行）
- 更多说明见应用内菜单「快捷键」「Markdown 标记」

## 开发

需要：Node.js、[pnpm](https://pnpm.io)、Rust 工具链，以及本机系统 WebView（Windows WebView2、macOS WKWebView、Linux WebKitGTK）。

```bash
pnpm install
pnpm tauri dev    # 开发（与安装版隔离为 LiliaMark Dev）
pnpm tauri build  # 打安装包
```

其它：

- `pnpm format` — dprint
- `pnpm lint` — ESLint
- `pnpm test:run` — Vitest

技术栈：Tauri 2 · Vite · React · TypeScript · CodeMirror 6 · markdown-it。仓库约定与分层见 [`AGENTS.md`](AGENTS.md)。

## 许可

[MIT](LICENSE) © Liu Yuchuan
