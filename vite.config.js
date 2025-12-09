import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'frontend',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'frontend/index.html'),
        auth: resolve(__dirname, 'frontend/auth.html'),
        dashboard: resolve(__dirname, 'frontend/dashboard.html'),
      },
    },
  },
  server: {
    port: 5173,
  },
});
