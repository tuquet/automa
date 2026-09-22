import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig, type Plugin } from 'vite'

interface ClientErrorPayload {
  service?: string
  message?: string
  stack?: string
  breadcrumbs?: unknown[]
}

function automaHmrErrorBridgePlugin(serviceName = 'DESK'): Plugin {
  return {
    name: 'automa-hmr-error-bridge',
    configureServer(server) {
      server.ws.on('automa:client-error', (data: ClientErrorPayload) => {
        const service = data?.service || serviceName
        const msg = data?.message || 'Unknown browser error'
        console.error(`[${service}] [ERROR] [BROWSER_EXCEPTION] ${msg}`)
        if (data?.stack) {
          console.error(`[${service}] [ERROR] ${data.stack}`)
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    automaHmrErrorBridgePlugin('DESK'),
    vue({
      template: {
        transformAssetUrls: {
          includeAbsolute: false,
        },
      },
    }),
    tailwindcss(),
  ],
  clearScreen: false,
  resolve: {
    dedupe: ['vue', 'pinia'],
  },
  server: {
    host: '127.0.0.1',
    port: 1420,
    strictPort: true,
  },
})
