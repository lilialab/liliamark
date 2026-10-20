# LiliaMark

跨平台、低内存的本地 Markdown 工具。打开本地文件编辑源码（语法高亮），用快捷键切换预览覆盖层。

## 方案

桌面壳用 Tauri 2。窗口走系统 WebView（Windows WebView2、macOS WKWebView、Linux WebKitGTK），不打包 Chromium。界面用 Vite + React + TypeScript。编辑用 CodeMirror 6，只做源码高亮。预览用 markdown-it 把原文转成 HTML，样式自己写。

文件的打开、读取、保存、磁盘变更监听放在 Rust 命令里。Markdown 解析留在前端；哪天预览成为瓶颈，再挪到 Rust。

内存主要花在 WebView 和编辑器上。React 和 Svelte 在这里的差距可以忽略，界面用 React。编辑器不用 Monaco：那是 VS Code 拆出来的编辑器，体积和内存都大一截。高亮也不做成「透明输入框压在彩色文字上」，中文输入、换行和滚动时两层会对不齐；CodeMirror 把着色和编辑放在同一套文档里。

## 第一版

做这些：

- 打开、保存本地文本文件（Markdown / 其它文本）
- 源码高亮；Ctrl/Cmd+E 切换预览覆盖层（预览按需加载）；Ctrl/Cmd+W 关闭当前标签（无标签时退出）
- 记住上次打开的文件，启动时恢复（打不开的跳过）；「打开方式」会在恢复后再打开并聚焦该文件
- 修改后预览跟着更新；界面 / 编辑器 / 预览统一 Catppuccin Macchiato（`src/theme/` + `@catppuccin/codemirror`；围栏 highlight.js）
- 相对路径的图片能在预览里显示（经 Tauri 的资源协议，不把裸文件路径写进 `<img>`）

先不做：

- 富文本、格式化工具栏、选区装饰
- 目录树和多文件工作区
- 左右滚动同步
- KaTeX、Mermaid、插件
- 账号、同步、服务器

编辑区用自拼的精简 CodeMirror extensions（行号、历史、选区、高亮等）和 `@codemirror/lang-markdown`。补全、折叠、lint、查找面板不在第一版里。

## 目录

```
src/screens/EditorScreen.tsx    主界面
src/components/                 可复用的小块 UI（有需要再加）
src/editor/                     CodeMirror 装配
src/preview/                    markdown-it 渲染（纯函数）和预览区
src/theme/                      Catppuccin 变量与应用语义色
src/lib/tauri/                  打开、读取、保存、监听的 invoke 封装（有 IO 再加）
src/utils/                      与 Markdown 无关的纯函数（有需要再加）
src/types/
src-tauri/src/                  文件读写和监听
tests/                          镜像 src/，不跟源码放在一起
```

数据流：编辑器把原文交给 `src/preview/` 渲染。打开和保存只经过 `src/lib/tauri/`，组件里不直接 `invoke`。Rust 命令只做文件 IO。

## 本地开发

脚手架用 pnpm。日常开发是 `pnpm tauri dev`，需要本机 Rust 工具链和对应平台的系统 WebView。

常用命令：

- `pnpm format` — dprint（[`dprint.json`](dprint.json)）
- `pnpm lint` — ESLint
- `pnpm test:run` — Vitest
- `pnpm tauri dev` / `pnpm tauri build`
