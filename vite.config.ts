import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
// @ts-expect-error type error without @types/node package
import process from 'node:process';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vitest/config';

const host = process.env.TAURI_DEV_HOST;
const analyze = process.env.ANALYZE === '1';

// https://vite.dev/config/
export default defineConfig(() => ({
  plugins: [
    react(),
    tailwindcss(),
    analyze
      ? visualizer({
        filename: 'dist/stats.html',
        open: true,
        gzipSize: true,
        brotliSize: true,
        template: 'treemap',
      })
      : null,
  ],

  // React + CodeMirror core sit in the main chunk; 500 kB warning is noisy for a desktop shell.
  build: {
    chunkSizeWarningLimit: 1024,
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
        protocol: 'ws',
        host,
        port: 1421,
      }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ['**/src-tauri/**'],
    },
  },

  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
}));
