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
    cssTarget: 'esnext',
    rolldownOptions: {
      // Every chunk holds hooks or event handlers, so RSC frameworks
      // (Next.js App Router) must treat the whole package as client code.
      output: { banner: "'use client';" },
      external:
        /^(?:react(?:-dom)?(?:\/.*)?|echarts(?:\/.*)?|react-data-grid|pdfjs-dist(?:\/.*)?|@tiptap\/.*)$/,
    },
  },
});
