import { resolve } from 'node:path';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  plugins: [
    vue(),
    dts({
      include: ['src/**/*.ts', 'src/**/*.vue'],
      insertTypesEntry: true,
      rollupTypes: false,
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'components/ui/index': resolve(__dirname, 'src/components/ui/index.ts'),
        'lib/utils': resolve(__dirname, 'src/lib/utils.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        'vue',
        'pinia',
        '@automa/types',
        '@automa/types/api',
        '@tuquet/vue-ui',
        '@tuquet/vue-table',
        '@lucide/vue',
        'lucide-vue-next',
        '@vueuse/core',
      ],
      output: {
        exports: 'named',
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'tokens.css';
          return assetInfo.name || '';
        },
      },
    },
  },
});
