import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'examples',
  base: './',
  publicDir: '../docs',
  plugins: [react()],
  resolve: {
    alias: {
      '@mega-ui/react/text-editor.css': fileURLToPath(
        new URL('./src/pro/text-editor.css', import.meta.url),
      ),
      '@mega-ui/react/data-grid.css': fileURLToPath(
        new URL('./src/pro/data-grid.css', import.meta.url),
      ),
      '@mega-ui/react/text-editor': fileURLToPath(
        new URL('./src/text-editor.ts', import.meta.url),
      ),
      '@mega-ui/react/data-grid': fileURLToPath(
        new URL('./src/data-grid.ts', import.meta.url),
      ),
      '@mega-ui/react': fileURLToPath(
        new URL('./src/index.ts', import.meta.url),
      ),
    },
  },
  build: { cssTarget: 'esnext', outDir: '../site', emptyOutDir: true },
});
