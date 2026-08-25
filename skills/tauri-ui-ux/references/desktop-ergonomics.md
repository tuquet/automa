# Desktop Ergonomics & UI/UX Best Practices for Tauri v2

Huong dan toan dien ve thiet ke trai nghiem nguoi dung tren moi truong Desktop Native ung dung Tauri v2 + Vue 3 + shadcn-vue.

---

## 1. Custom Frameless Titlebar Architecture

### A. Template Structure (`AppTitleBar.vue`)
```vue
<template>
  <header 
    data-tauri-drag-region 
    class="flex h-10 w-full select-none items-center justify-between border-b bg-background px-3 text-xs"
    @dblclick="handleDoubleClick"
  >
    <!-- Left: App Icon & Breadcrumbs -->
    <div class="flex items-center gap-2 pointer-events-none">
      <img src="/icons/32x32.png" class="h-4 w-4" alt="App Logo" />
      <span class="font-semibold text-foreground">Automa Desktop</span>
      <span class="text-muted-foreground">/</span>
      <span class="text-muted-foreground">{{ currentRouteTitle }}</span>
    </div>

    <!-- Center: Global Search / Command Trigger -->
    <div class="no-drag flex items-center">
      <button 
        @click="openCommandPalette" 
        class="flex h-7 items-center gap-2 rounded-md border bg-muted/50 px-3 text-xs text-muted-foreground hover:bg-muted"
      >
        <Search class="h-3.5 w-3.5" />
        <span>Quick search or command...</span>
        <kbd class="pointer-events-none rounded bg-background px-1.5 py-0.5 text-[10px] font-mono shadow-sm">Ctrl+K</kbd>
      </button>
    </div>

    <!-- Right: Window Actions -->
    <div class="no-drag flex items-center gap-1">
      <button @click="toggleTheme" class="h-7 w-7 rounded hover:bg-muted flex items-center justify-center">
        <Sun v-if="isDark" class="h-3.5 w-3.5" />
        <Moon v-else class="h-3.5 w-3.5" />
      </button>
      <button @click="minimizeWindow" class="h-7 w-7 rounded hover:bg-muted flex items-center justify-center">
        <Minus class="h-3.5 w-3.5" />
      </button>
      <button @click="toggleMaximize" class="h-7 w-7 rounded hover:bg-muted flex items-center justify-center">
        <Square class="h-3 w-3" />
      </button>
      <button @click="closeWindow" class="h-7 w-7 rounded hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center">
        <X class="h-3.5 w-3.5" />
      </button>
    </div>
  </header>
</template>
```

---

## 2. Command Palette Pattern (`CommandPalette.vue`)

Su dung Radix Vue Dialog / Combobox de tao Command Palette kich hoat bang `Ctrl+K` hoac `Cmd+K`:
- Ho tro dieu huong nhanh toi cac views: `Dashboard`, `Workflows`, `Browsers`, `Live Logs`, `Settings`.
- Ho tro hanh dong nhanh: `Start Engine`, `Stop Engine`, `Launch Browser Profile`, `Clear Logs`, `Toggle Dark Mode`.

---

## 3. Desktop Single-Instance & State Persistence

1. **`tauri-plugin-single-instance`**:
   Khi nguoi dung khoi chay app lan 2, su kien se focus cua so hien co thay vi mo them app moi:
   ```rust
   .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
       let _ = app.get_webview_window("main").map(|w| {
           let _ = w.show();
           let _ = w.set_focus();
       });
   }))
   ```

2. **`tauri-plugin-window-state`**:
   Tu dong nho kich thuoc, vi tri va trang thai maximize cua cua so:
   ```rust
   .plugin(tauri_plugin_window_state::Builder::default().build())
   ```
