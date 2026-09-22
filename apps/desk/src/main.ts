import { createAutomaUiPlugin } from '@automa/ui'
import { error as logError } from '@tauri-apps/plugin-log'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import '@automa/ui/dist/ui.css'
import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)

app.use(createPinia())
app.use(createAutomaUiPlugin({ baseUrl: 'http://127.0.0.1:8765' }))
app.use(router)

app.config.errorHandler = (err, _instance, info) => {
  const msg = err instanceof Error ? err.message : String(err)
  const stack = err instanceof Error ? err.stack : undefined
  console.error(`Unhandled Vue error (${info}):`, err)
  logError(`Unhandled Vue error (${info}): ${msg}`).catch(() => {})
  if (import.meta.hot) {
    import.meta.hot.send('automa:client-error', {
      service: 'DESK',
      message: `Unhandled Vue error (${info}): ${msg}`,
      stack,
    })
  }
}

window.addEventListener('unhandledrejection', (event) => {
  const msg = event.reason instanceof Error ? event.reason.message : String(event.reason)
  const stack = event.reason instanceof Error ? event.reason.stack : undefined
  console.error('Unhandled promise rejection:', event.reason)
  logError(`Unhandled promise rejection: ${msg}`).catch(() => {})
  if (import.meta.hot) {
    import.meta.hot.send('automa:client-error', {
      service: 'DESK',
      message: `Unhandled promise rejection: ${msg}`,
      stack,
    })
  }
})

// oxide:frontend-init

app.mount('#app')
