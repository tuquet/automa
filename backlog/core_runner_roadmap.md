# 🚀 Automa Core Runner Evolution Roadmap

Lộ trình này phác thảo chiến lược dài hạn nhằm thay thế Core Runner hiện tại (viết bằng Node.js/Puppeteer) sang một Sidecar hiệu năng cao viết bằng **Rust**, nhằm tối ưu hóa bộ nhớ, tăng tốc độ thực thi và quản lý tài nguyên (Memory/CPU) triệt để hơn.

---

## 🛑 Những điểm nghẽn hiện tại (Bottlenecks)
- **Tiêu thụ RAM (Memory Footprint):** Node.js Runtime + Puppeteer ngốn rất nhiều RAM ngay từ lúc Cold Start (khởi động nguội).
- **Phân phối khó khăn (Distribution):** Người dùng phải cài Node.js, `npx`, hoặc cài các gói npm tốn thời gian. Quản lý Node version phức tạp.
- **Rò rỉ tài nguyên (Memory Leak):** Quản lý tiến trình (Child processes) và trình duyệt mồ côi (Zombie browsers) trong Node.js gặp nhiều giới hạn khi có crash bất ngờ.

---

## 🗺️ Lộ trình Chuyển đổi (Migration Roadmap)

### Phase 1: Chuẩn bị & Trừu tượng hóa (Decoupling)
*Tách bạch hoàn toàn VS Code Extension (Giao diện) khỏi Logic chạy (Core).*

- **Chuẩn hóa Giao thức Giao tiếp (IPC):** Không phụ thuộc vào lệnh `automa cli ...`. Thiết kế một chuẩn giao tiếp chung qua I/O (Standard Input/Output) dưới định dạng JSON-RPC.
- **Abstraction Layer:** Đảm bảo lớp `TaskRunner` trong VS Code Extension có thể hoán đổi file thực thi (từ `node cli.js` sang `automa-core.exe`) mà không cần sửa dòng code UI nào.
- **Tái cấu trúc (Refactor) trạng thái:** Mọi dữ liệu (Fleets, Variables) phải được truyền qua file hoặc qua luồng dữ liệu chuẩn, không chia sẻ bộ nhớ.

### Phase 2: Khởi tạo Rust Core Engine (MVP)
*Xây dựng bộ khung Rust song song, bắt đầu bằng các Task nhẹ nhất.*

- **Khởi tạo Project:** Sử dụng Cargo để tạo dự án `automa-core`. 
- **Đa luồng (Concurrency):** Sử dụng `Tokio` (Async Runtime số 1 của Rust) để xử lý hàng nghìn luồng bất đồng bộ mà không nghẽn CPU.
- **Trình duyệt Web:** Tích hợp các thư viện kết nối Chrome/Chromium Native:
  - `chromiumoxide` hoặc `headless_chrome` (Giao tiếp trực tiếp với Chrome DevTools Protocol - CDP, siêu nhẹ).
  - Hoặc `playwright-rust`.
- **Triển khai Parser:** Viết bộ parser để đọc file `.automa.json` và biên dịch các node thành các luồng thực thi trong Rust.

### Phase 3: Nâng cấp Giao tiếp Hệ thống (Advanced IPC & Daemon)
*Thay thế Daemon Node.js hiện tại.*

- **Rust Daemon:** `automa-core` sẽ có một chế độ `--daemon`. Nó sẽ tự động dựng lên một Local Server bằng `Axum` hoặc `Actix-web` (Cực kỳ nhanh và nhẹ).
- **Request Stacking an toàn:** Rust xử lý Queue và Job cực kỳ an toàn với cơ chế Ownership, loại bỏ hoàn toàn tình trạng Race Condition hay Deadlock.
- **Streaming Log:** Đẩy thẳng log từ Rust sang VS Code Extension thông qua gRPC hoặc Websocket để Panel hiển thị Real-time.

### Phase 4: Quản lý Hạm đội (Fleet Orchestration)
*Phát huy sức mạnh lớn nhất của Rust: Quản lý tiến trình diện rộng.*

- **Concurrency Tối đa:** Rust sẽ tự tay quản lý hàng tá instance Chrome, tự động giới hạn (Throttle) số lượng CPU/RAM được phép dùng.
- **Bắt lỗi & Diệt Zombie (Zombie Slaying):** Rust có khả năng kiểm soát tín hiệu OS (SIGTERM, SIGKILL) sâu hơn Node.js rất nhiều. Bất cứ khi nào VS Code bấm "Kill", Rust sẽ dập tắt sạch sẽ toàn bộ các tiến trình Chrome con mồ côi (Orphan processes) mà không để lại rác bộ nhớ.

### Phase 5: Build & Phân phối toàn cầu (Distribution)
*Đưa Core mới đến tay người dùng một cách trong suốt.*

- **Multi-target Compilation:** Thiết lập GitHub Actions tự động biên dịch code Rust ra 3 định dạng:
  - `automa-core-windows.exe`
  - `automa-core-linux`
  - `automa-core-macos-arm64` / `x64`
- **Zero-Dependency Bundle:** Nhúng thẳng file Binary này vào trong file `.vsix` của VS Code Extension.
- **Người dùng cuối:** Cài Extension là dùng được luôn! Không cần cài Node.js, không cần biết NPM là gì. Hệ thống sẽ có tốc độ khởi động tức thì (Zero-second startup).

---

> [!TIP]
> Việc đập đi xây lại Core bằng Rust không phải là công việc một sớm một chiều. Chiến lược an toàn nhất là làm theo phương pháp **Strangler Fig Pattern**: Ban đầu Rust Sidecar sẽ chỉ chạy những Workflow đơn giản. Những Workflow phức tạp vẫn đẩy sang Node.js cũ. Dần dần, Rust sẽ "nuốt chửng" toàn bộ các tính năng cho đến khi Node.js hoàn toàn bị khai tử.
