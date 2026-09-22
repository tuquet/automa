# 🎨 @automa/ui: Gói Thư Viện Giao Diện & Dữ Liệu Dùng Chung Cho Hệ Sinh Thái Automa

Chào mừng bạn đến với **`@automa/ui`**!

Hãy tưởng tượng hệ sinh thái **Automa** giống như một hãng xe hơi cao cấp sản xuất 3 dòng xe khác nhau:
- 🏎️ **Dòng xe Desktop**: Ứng dụng độc lập cài trên máy tính (`apps/desk`).
- 🚗 **Dòng xe Web Extension**: Tiện ích chạy trên trình duyệt Chrome (`apps/webe`).
- 🚙 **Dòng xe VS Code**: Tiện ích chạy trực tiếp trong trình soạn thảo VS Code (`apps/vsce`).

**`@automa/ui`** chính là **khối động cơ, vô-lăng và bảng điều khiển thông minh chuẩn hóa dùng chung** cho cả 3 dòng xe đó:
- Khi cần một chiếc vô-lăng (ví dụ: nút chọn trình duyệt, màn hình console xem log), cả 3 xe đều lắp chung một linh kiện hoàn hảo từ `@automa/ui`.
- Khi nâng cấp động cơ (tăng tốc độ cuộn, tự động làm mới dữ liệu), **cả 3 dòng xe đều đồng loạt mạnh lên mà không phải tháo rời chế tạo lại từ đầu**.

---

## 🌟 4 ĐIỂM NỔI BẬT CỦA `@automa/ui`

### 1. ⚡ Cuộn Siêu Mượt Không Bao Giờ Giật Lag (TanStack Virtual)
- Dù danh sách có **10.000 trình duyệt** hay **100.000 dòng log đang chạy ầm ầm**, màn hình vẫn cuộn êm ru ở tốc độ 60fps vì hệ thống chỉ vẽ đúng các dòng bạn đang nhìn thấy trên mắt, giúp máy tính luôn mát mẻ và tiết kiệm RAM.

### 2. 🌊 Tự Động Làm Mới Dữ Liệu Theo Thời Gian Thực (SSE Auto-Invalidation)
- Bạn không bao giờ phải bấm nút "Tải lại" (F5/Refresh) thủ công. Khi Backend tạo mới một trình duyệt hoặc chạy xong một kịch bản, bảng điều khiển tự động cập nhật ngay trước mắt bạn trong chớp mắt.

### 3. 🎯 Lắp Ráp Nhanh Trong 1 Nốt Nhạc (Plug & Play)
- Lập trình viên chỉ cần gọi đúng 1 dòng component (như `<RemoteVirtualSelect />` hoặc `<ExecutionConsoleDrawer />`), component sẽ tự động lo hết mọi việc: từ tải dữ liệu, lọc tìm kiếm, đến hiển thị huy hiệu (Online/Offline).

### 4. 🎨 Tự Đổi Màu Theo Từng Ứng Dụng (Adaptive Theme)
- Khi thả component vào VS Code, nó tự đổi theo màu của VS Code. Khi mở trên Desktop hay Web, nó tự thích ứng theo chế độ Sáng / Tối (Dark / Light mode).

---

## 🚀 HƯỚNG DẪN SỬ DỤNG NHANH

### 1. Khởi tạo trong ứng dụng
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

### 2. Sử dụng Component Dropdown Chọn Profile
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
    placeholder="Chọn profile trình duyệt..."
  />
</template>
```

---

## 📁 CẤU TRÚC GÓI

```
packages/automa-ui/
├── src/
│   ├── stores/        # 🍍 6 Pinia Domain Stores (Workflow, Browser, Execution, Storage, Campaign, Settings)
│   ├── hooks/         # 🌐 TanStack Query Hooks (Tự động cache & fetch dữ liệu)
│   ├── plugin/        # 🌊 Plugin tự động lắng nghe sự kiện realtime
│   ├── components/    # 🎨 Các linh kiện giao diện ảo hóa (Dropdown, Console Drawer, Danh sách)
│   └── styles/        # 🌈 Bảng màu Semantic Tokens tương thích mọi nền tảng
```
