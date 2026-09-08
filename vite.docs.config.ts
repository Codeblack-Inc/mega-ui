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
      '@mega-ui/react': fileURLToPath(
        new URL('./src/index.ts', import.meta.url),
      ),
    },
  },
  build: { outDir: '../site', emptyOutDir: true },
});
