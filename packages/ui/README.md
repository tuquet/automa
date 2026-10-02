# 🎨 @automa/ui: Shared Component Library & State Store

> **Unified Enterprise UI Primitives, Reactive State Stores & Virtualized Data Components**

`@automa/ui` provides standardized UI primitives, virtualized components, and domain state stores shared across Automa clients:
- 🏎️ **Desktop Suite**: Standalone desktop app (`apps/desk`).
- 🚗 **Web Extension**: Manifest V3 Chrome/Edge extension (`apps/webe`).
- 🚙 **VS Code Studio**: In-editor extension (`apps/vsce`).

By centralizing shared components and domain stores in `@automa/ui`, any performance optimization (virtual scrolling, automatic data re-fetching) is instantly propagated across all client form factors.

---

## 🌟 Key Highlights

### 1. ⚡ High-Throughput Virtualization (TanStack Virtual)
- Smoothly scrolls lists with **10,000+ browser profiles** or **100,000+ active execution logs** at 60fps. Only viewport rows are rendered into the DOM, minimizing memory footprint and CPU load.

### 2. 🌊 Real-Time Automatic Re-validation (SSE Auto-Invalidation)
- Eliminates manual refresh buttons. When the backend initializes a browser profile or completes a job, frontend state updates automatically via Server-Sent Events.

### 3. 🎯 Plug & Play Component Architecture
- Developers embed components in one line (e.g. `<RemoteVirtualSelect />` or `<ExecutionConsoleDrawer />`). The component autonomously manages data fetching, query debouncing, filtering, and connection status badges.

### 4. 🎨 Adaptive Theming & Token Mapping
- Automatically inherits the host environment's color tokens (VS Code theme tokens in VSCE, dark/light mode in Desktop and Web).

---

## 🚀 Quick Start

### 1. App Initialization
```ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createAutomaUiPlugin } from '@automa/ui'
import '@automa/ui/styles'

const app = createApp(App)
app.use(createPinia())
app.use(createAutomaUiPlugin({ baseUrl: 'http://127.0.0.1:8765' }))
app.mount('#app')
```

### 2. Browser Profile Dropdown Component
```vue
<script setup>
import { ref } from 'vue'
import { RemoteVirtualSelect } from '@automa/ui'

const selectedBrowser = ref('default')
</script>

<template>
  <RemoteVirtualSelect
    id="select.browser.profile"
    v-model="selectedBrowser"
    placeholder="Select browser profile..."
  />
</template>
```

---

## 📁 Package Structure

```
packages/ui/
├── src/
│   ├── stores/        # 🍍 6 Pinia Domain Stores (Workflow, Browser, Execution, Storage, Campaign, Settings)
│   ├── hooks/         # 🌐 TanStack Query Hooks (Automated caching & data fetching)
│   ├── plugin/        # 🌊 Plugin listening to real-time telemetry events
│   ├── components/    # 🎨 Virtualized UI components (Dropdowns, Console Drawer, Tables)
│   └── styles/        # 🌈 Cross-platform semantic tokens and CSS styles
```
