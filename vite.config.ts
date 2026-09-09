import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: { index: 'src/index.ts', 'data-grid': 'src/data-grid.ts' },
      formats: ['es'],
      fileName: (_format, name) => `${name}.js`,
      cssFileName: 'data-grid',
    },
    sourcemap: true,
    cssTarget: 'esnext',
    rolldownOptions: {
      external: /^(?:react(?:-dom)?(?:\/.*)?|react-data-grid)$/,
    },
  },
});
