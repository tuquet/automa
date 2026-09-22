import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tailwindCssPath = path.resolve(__dirname, 'src/assets/css/tailwind.css').replace(/\\/g, '/');

function tailwindVueStyleReferencePlugin() {
  return {
    name: 'tailwind-vue-style-reference',
    enforce: 'pre',
    transform(code, id) {
      if ((id.includes('.vue') && id.includes('type=style')) || (id.endsWith('.css') && !id.includes('tailwind.css'))) {
        if (code.includes('@apply') && !code.includes('@reference')) {
          return {
            code: `@reference "${tailwindCssPath}";\n${code}`,
            map: null,
          };
        }
      }
    },
  };
}

function runnerAssetsPlugin() {
  return {
    name: 'runner-assets-plugin',
    generateBundle() {
      // 1. Manifest V3 for Runner (stripped of UI permissions)
      const manifestPath = path.resolve(__dirname, 'src/manifest.chrome.json');
      if (fs.existsSync(manifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        delete manifest.action;
        delete manifest.options_ui;
        delete manifest.chrome_url_overrides;
        manifest.name = `${manifest.name} (Runner)`;
        if (!manifest.version) {
          manifest.version = '1.28.27';
        }

        this.emitFile({
          type: 'asset',
          fileName: 'manifest.json',
          source: JSON.stringify(manifest, null, 2),
        });
      }

      // 2. dummy.html
      this.emitFile({
        type: 'asset',
        fileName: 'dummy.html',
        source: '<!DOCTYPE html><html><head></head><body></body></html>',
      });

      // 3. offscreen.html
      this.emitFile({
        type: 'asset',
        fileName: 'offscreen.html',
        source: '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Offscreen</title></head><body><iframe src="/sandbox.html" id="sandbox" style="display: none;"></iframe><script type="module" src="./offscreen.bundle.js"></script></body></html>',
      });

      // 4. sandbox.html
      this.emitFile({
        type: 'asset',
        fileName: 'sandbox.html',
        source: '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Sandbox</title></head><body><script type="module" src="./sandbox.bundle.js"></script></body></html>',
      });

      // 5. Icons
      const iconPath = path.resolve(__dirname, 'src/assets/images/icon-128.png');
      if (fs.existsSync(iconPath)) {
        this.emitFile({
          type: 'asset',
          fileName: 'icon-128.png',
          source: fs.readFileSync(iconPath),
        });
      }
      const iconDevPath = path.resolve(__dirname, 'src/assets/images/icon-dev-128.png');
      if (fs.existsSync(iconDevPath)) {
        this.emitFile({
          type: 'asset',
          fileName: 'icon-dev-128.png',
          source: fs.readFileSync(iconDevPath),
        });
      }
    },
  };
}

export default defineConfig({
  plugins: [
    tailwindVueStyleReferencePlugin(),
    vue(),
    tailwindcss(),
    runnerAssetsPlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'webextension-polyfill': path.resolve(__dirname, 'business/dev/lib/browser-compat.js'),
      '@/utils/api': path.resolve(__dirname, 'business/dev/utils/api-runner-mock.js'),
      '@business$': path.resolve(__dirname, 'business/dev/index.js'),
      '@business': path.resolve(__dirname, 'business/dev'),
      secrets: path.resolve(__dirname, 'secrets.blank.js'),
      vue: 'vue/dist/vue.esm-bundler.js',
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    BROWSER_TYPE: JSON.stringify(process.env.BROWSER || 'chrome'),
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
    __IS_RUNNER__: true,
  },
  build: {
    outDir: path.resolve(__dirname, 'dist/cli-runner'),
    emptyOutDir: true,
    target: 'esnext',
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === 'INEFFECTIVE_DYNAMIC_IMPORT') return;
        warn(warning);
      },
      input: {
        background: path.resolve(__dirname, 'src/background/index.js'),
        offscreen: path.resolve(__dirname, 'src/offscreen/runner-entry.js'),
        contentScript: path.resolve(__dirname, 'src/content/index.js'),
        sandbox: path.resolve(__dirname, 'src/sandbox/index.js'),
        webService: path.resolve(__dirname, 'src/content/services/webService.js'),
        recordWorkflow: path.resolve(__dirname, 'src/content/services/recordWorkflow/index.js'),
        elementSelector: path.resolve(__dirname, 'src/content/elementSelector/index.js'),
      },
      output: {
        entryFileNames: '[name].bundle.js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: '[name].[ext]',
        format: 'es',
      },
    },
  },
});
