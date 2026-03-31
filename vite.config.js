import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  base: '/dfs-interactive-tutorial/',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    open: true,
  },
});
