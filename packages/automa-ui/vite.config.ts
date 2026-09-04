import { resolve } from 'node:path'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

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
        'stores/index': resolve(__dirname, 'src/stores/index.ts'),
        'hooks/index': resolve(__dirname, 'src/hooks/index.ts'),
        'components/index': resolve(__dirname, 'src/components/index.ts'),
        'plugin/index': resolve(__dirname, 'src/plugin/index.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        'vue',
        'pinia',
        '@automa/types',
        '@automa/types/api',
        '@tanstack/vue-query',
        '@tanstack/vue-table',
        '@tanstack/vue-virtual',
        '@vueuse/core',
        'lucide-vue-next',
      ],
      output: {
        exports: 'named',
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'tokens.css'
          return assetInfo.name || ''
        },
      },
    },
  },
})
