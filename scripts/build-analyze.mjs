/**
 * 前端体积分析：ANALYZE=1 跑 vite build，写出 dist/stats.html 并尝试打开。
 */
import { spawnSync } from 'node:child_process';
import process from 'node:process';

process.env.ANALYZE = '1';

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env: process.env,
    shell: true,
  });
  if (result.status) {
    process.exit(result.status);
  }
}

run('pnpm', ['exec', 'tsc']);
run('pnpm', ['exec', 'vite', 'build']);
