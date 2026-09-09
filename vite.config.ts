import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: 'src/index.ts',
        charts: 'src/charts.ts',
        'data-grid': 'src/data-grid.ts',
        'text-editor': 'src/text-editor.ts',
        'pdf-viewer': 'src/pdf-viewer.ts',
      },
      formats: ['es'],
      fileName: (_format, name) => `${name}.js`,
    },
    cssCodeSplit: true,
    sourcemap: true,
    cssTarget: 'esnext',
    rolldownOptions: {
      external:
        /^(?:react(?:-dom)?(?:\/.*)?|echarts(?:\/.*)?|react-data-grid|pdfjs-dist(?:\/.*)?|@tiptap\/.*)$/,
    },
  },
});
