# LiliaMark

English | [简体中文](README.zh-CN.md)

Cross-platform local Markdown / text editor. Edit with syntax highlighting, toggle preview with a shortcut. Built with Tauri 2 and the system WebView — no bundled Chromium.

<!-- Add a screenshot later, e.g. ![LiliaMark](docs/screenshot.png) -->

## Features

- Open, edit, and save local text (Markdown, JSON, YAML, TOML, HTML, and more)
- CodeMirror syntax highlighting; multi-tab with drag-and-drop reorder
- `Ctrl/Cmd+E` preview: in-app Markdown; HTML opens in the system browser (no in-app script execution)
- Read-only GFM task lists; auto-save on editor blur and window blur
- Restore last opened files; supports OS “Open with”
- UI theme: Catppuccin Macchiato; UI language follows the system (override to Chinese / English in Settings)

Out of scope for now: rich-text toolbar, file tree, scroll sync, KaTeX / Mermaid, accounts and sync.

## Install

Download the build for your platform from the repository **Releases** page:

| Platform | Recommended asset |
|----------|-------------------|
| Windows | `*_x64-setup.exe` or `*_x64_en-US.msi` |
| macOS (Apple Silicon) | `*_aarch64.dmg` |
| macOS (Intel) | `*_x64.dmg` |
| Linux (Debian / Ubuntu) | `*_amd64.deb` or AppImage |
| Linux (Fedora, etc.) | `*.rpm` |

Builds are **unsigned** by default: Windows may show SmartScreen; on macOS you may need right-click → Open the first time.

## Usage

- `Ctrl/Cmd+S` save · `Ctrl/Cmd+E` preview · `Ctrl/Cmd+F` find / replace · `Ctrl/Cmd+W` close tab · `Ctrl/Cmd+Q` quit
- `Shift+scroll` horizontal scroll (editor does not soft-wrap)
- More details in the in-app **Keyboard shortcuts** and **Markdown reference** menus

## Development

Requires Node.js, [pnpm](https://pnpm.io), a Rust toolchain, and the platform WebView (WebView2 / WKWebView / WebKitGTK).

```bash
pnpm install
pnpm tauri dev    # development (isolated as LiliaMark Dev from the installed app)
pnpm tauri build  # produce installers
```

Also:

- `pnpm format` — dprint
- `pnpm lint` — ESLint
- `pnpm test:run` — Vitest

Stack: Tauri 2 · Vite · React · TypeScript · CodeMirror 6 · markdown-it. Project conventions live in [`AGENTS.md`](AGENTS.md) (Chinese).

## License

[MIT](LICENSE) © Liu Yuchuan
