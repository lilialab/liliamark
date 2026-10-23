# LiliaMark Agent 指南

跨平台本地 Markdown 编辑预览（Tauri 2 + Rust + Vite + React + CodeMirror 6）。桌面应用，不为浏览器单独降级。产品范围以 [README.md](README.md) 为准。

## 读文件

读多少由任务决定，不由文件大小决定。

Grep / Glob 定位 → 再 Read。按下方「任务入口」定点读；禁止全仓 explore、整目录 Read、全仓 subagent，或一次串读 editor + preview + tauri 全链路。大范围探查（多文件、一条链路）交给 subagent，主上下文只收结论。

- **评审改动**：读改动本身（`git diff` 或改动处），不整读文件 —— 未改动的部分不是评审对象。
- **评审整体设计 / 可读性**：整读目标文件（或整套模块）再下结论。
- 提问没点明范围时（「你觉得怎么样」）：按最小够用读，并说明读了什么范围。

理由：`read` 不受 spill 保护（上限 `readLimit` 2000 行 / `readMaxBytes` 51200 字节），读进来的内容此后每轮都要重发。

## 代码导航

文件不存在时按此路径新增，不要另起一套目录。`src/components/`、`src/lib/tauri/`、`src/utils/`、`src/types/` 有实际代码再加，不建空目录。

| 层级 | 路径 |
|------|------|
| 主界面 | `src/screens/EditorScreen.tsx` |
| 可复用 UI | `src/components/` |
| 编辑器装配 | `src/editor/`（CodeMirror；只做源码高亮） |
| 预览 | `src/preview/`（markdown-it → HTML 的纯函数，以及预览区） |
| 主题色 | `src/theme/`（`flavor.ts` 的 `APP_FLAVOR`；`--ctp-*` 与 `--app-*` / `--md-*`） |
| 桌面 IO 封装 | `src/lib/tauri/`（唯一裸 `invoke` 出口） |
| 共享类型 | `src/types/` |
| 纯函数 | `src/utils/`（无 I/O，不依赖 Tauri / DOM） |
| Rust 命令 | `src-tauri/src/`（读、写、监听文件） |
| 单测 | `tests/` 镜像 `src/`；**不**在 `src/` 内 co-locate |

- 有预览语义的纯函数放 `src/preview/`，不要塞进 `src/utils/`。
- Rust 只做文件 IO。Markdown 解析留在 `src/preview/`，预览成为瓶颈之前不要搬进 Rust。

## 任务入口

引用一律用仓库根全路径。

| 任务 | 先读 |
|------|------|
| 产品范围 / 第一版做什么 | `README.md` |
| 主界面、预览覆盖、脏状态 | `src/screens/EditorScreen.tsx` |
| 源码高亮 | `src/editor/` |
| Markdown 渲染、图片路径 | `src/preview/` |
| 打开 / 保存 / 监听 / 设置 | `src/lib/tauri/`，再进 `src-tauri/src/` |
| 纯函数单测 | `tests/` 里与源文件对应的用例 |

## 命令与环境

- 沙箱只放行工作区写入：pnpm 加 `COREPACK_HOME=/tmp/corepack`，dprint 加 `DPRINT_CACHE_DIR=/tmp/dprint-cache`（默认 `~/.cache` 会被拦）
- 命令：`pnpm format`、`pnpm lint`、`pnpm test:run`、`pnpm tauri dev`、`pnpm tauri build`
- dprint 插件用 `node_modules` 里的 wasm（见 `dprint.json`）。Windows 上 `npm:@dprint/...` 会因路径里的 `:` 解析失败，不要改回
- 边界：签名密钥和系统 WebView 依赖由用户自己装；代理只跑上面列出的命令

## 分层

| 层级 | 职责 | 禁止 |
|------|------|------|
| 共用 UI（`src/components/`） | 纯展示 | `invoke`、调 `lib/tauri`、解析 Markdown |
| 业务模块（`src/editor/` 等）/ Screen / hook | 编排与域逻辑；IO 只经 `lib/tauri` | 裸 `invoke` |
| `src/preview/` | 原文 → HTML | Tauri、DOM |
| `src/lib/tauri/` | 打开、读取、保存、监听 | 业务分支、渲染 |
| Rust 命令 | 文件 IO | 解析 Markdown、碰 UI |

- 编辑是源码高亮，不是富文本。不要加格式化工具栏、选区装饰、ProseMirror / TipTap
- CodeMirror 自拼精简 extensions（见 `src/editor/editorExtensions.ts`）+ `@codemirror/lang-markdown` 和一套主题；不要用整包 `basicSetup`，不要换 Monaco，也不要自己写高亮层
- 预览用 markdown-it。第一版不上 KaTeX、Mermaid、目录树、滚动同步
- 相对路径图片经 Tauri 资源协议交给 WebView，不把裸文件路径写进 `<img>`
- 要超出 README「第一版」时，先跟用户确认

## 代码风格

- 格式：[`dprint.json`](dprint.json)（改完 `pnpm format`）。冲突时可读性优先。
- 分层见「代码导航」，此处不重复。
- **可读性优先于防御性**：难读比偶发错误更糟。不为「万一」加多余分支、mirror state、双重解析、重复校验；边界校验只放在真正边界（Tauri 命令、文件对话框、外部路径），内层信任上游。能用类型、命名、单测表达的，不用运行时 `if` 堆砌。
- 用户对代码风格 / 实现提出异议或质疑时（如「这样写有问题吗」「我不太喜欢」「为什么不…」）：优先对照社区主流做法与共识强弱（主流约定 / 常见偏好 / 有争议）来评估，再说明本仓库现有约定。不要默认维护现状或只给个人偏好；本仓与社区冲突时先讲清差异，再让用户决定跟谁。

细则：

- 优先 ES2015+（async/await、解构、可选链等）
- TSX：`cond && <A />`，勿 `cond ? <A /> : null`；真三元时分支体积过大 → 同文件私有组件或 early return
- React 组件 props：必须用具名 `XxxProps`，再 `({ … }: XxxProps)`；禁止内联 `({ foo }: { foo: T })`
- 列表：`map` / `filter` / `reduce` / `flatMap`；顺序副作用或 `await` → `for...of`；禁用 `for...in`、破坏性 `sort` / `reverse` / `splice`（用 `toSorted` 等 / `.at()`）
- `import type`；数组写 `T[]`
- 可选字段扁平：`key: value | undefined`；勿 `...(cond ? { key } : {})`
- 默认值用 `??`；布尔组合或空串也要 fallback 时用 `||`
- `src/preview/`、`src/lib/tauri/` 的 export 函数补简短中文 JSDoc
- **异步副作用**：`useEffect` 等里用具名 `async function` + `void name()`（需 cleanup 时 `const ready = name()`），不要 `(async () => { … })()` 自调用
- **拆分与分段 banner**：先判断拆不拆，banner 不替代拆分。有独立职责/复用/嵌套过深 → 抽组件、hook 或域内模块；只出现一次且拆了更难读、或「将来可能复用」的提前拆 → 不拆。仍合在一处且偏长（约 ≥100～150 行或多段逻辑）→ 加 banner；短文件、单线薄封装不加。格式：

```
/* -------------------------------------------------------------------------- */
/* Section name                                                               */
/* -------------------------------------------------------------------------- */
```

  常见分段：Screen → `State & data` / `Handlers` / `Render`。顺序可按可读性微调，勿借机改逻辑。

## 测试

改纯函数（`src/preview/` 的渲染、`src/utils/`）：同步更新 `tests/` 对应用例。依赖系统 WebView 或真实文件系统的路径不强制 E2E。
