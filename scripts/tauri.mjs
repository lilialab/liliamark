/**
 * 转发 @tauri-apps/cli；`dev` 时合并 tauri.dev.conf.json，
 * 与安装版隔离 identifier / 单实例 / 应用数据。
 */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);

if (args[0] === 'dev') {
  args.splice(1, 0, '--config', path.join(root, 'src-tauri', 'tauri.dev.conf.json'));
}

const cliJs = path.join(
  path.dirname(require.resolve('@tauri-apps/cli/package.json')),
  'tauri.js',
);

const child = spawn(process.execPath, [cliJs, ...args], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.exit(1);
  }
  process.exit(code ?? 1);
});
