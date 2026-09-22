import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'webextension-polyfill': path.resolve(__dirname, 'src/studio/standalone-browser-mock.js'),
      '@/utils/api': path.resolve(__dirname, 'business/dev/utils/api-runner-mock.js'),
      '@business$': path.resolve(__dirname, 'business/dev/index.js'),
      '@business': path.resolve(__dirname, 'business/dev'),
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['tests/**/*.test.{js,ts}'],
    exclude: ['dist/**', 'node_modules/**'],
  },
});
