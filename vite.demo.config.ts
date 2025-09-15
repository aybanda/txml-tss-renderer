import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'demo',
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react'
  },
  build: {
    outDir: '../dist-demo',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'demo/index.html'),
        'working-imgui': resolve(__dirname, 'demo/working-imgui-demo.html'),
        'jsx-working': resolve(__dirname, 'demo/jsx-working-demo.html')
      }
    }
  },
  server: {
    port: 3001,
    open: '/index.html'
  }
});
