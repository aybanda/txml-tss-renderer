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
        'working-imgui': resolve(__dirname, 'demo/working-imgui-demo.html'),
        'jsx-working': resolve(__dirname, 'demo/jsx-working-demo.html'),
        'build-time-jsx': resolve(__dirname, 'demo/build-time-jsx-demo.html')
      }
    }
  },
  server: {
    port: 3001,
    open: '/working-imgui-demo.html'
  }
});
