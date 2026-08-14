---
title: Tầm nhìn & Lộ trình Di cư Rust Core (Horizon 3)
date: 2026-08-14
tags:
  - architecture
  - rust
  - roadmap
---

# Lộ trình Di cư Kiến trúc Rust Core (Horizon 3)

Tài liệu này ghi nhận quyết định kiến trúc chiến lược chuyển dịch phần lõi điều phối của hệ sinh thái Automa từ Node.js (`automa-cli`) sang Rust (`automa-core`).

## 1. Mục tiêu (Vision)
- **Zero-Dependency**: Người dùng không cần cài đặt Node.js để chạy Daemon. Phân phối dưới dạng Native Binary độc lập.
- **Tối ưu cực đoan**: Tốc độ khởi động (Cold Start) < 100ms. Giảm 80% dung lượng RAM tiêu thụ khi chạy ngầm 24/7.
- **Fearless Concurrency**: Quản lý hàng chục trình duyệt (Puppeteer/CDP) an toàn, dọn dẹp triệt để Zombie Process.

## 2. Kiến trúc Tích hợp (Adapter Pattern)

Việc di cư áp dụng **Strangler Fig Pattern** (Xây mới song song, thay thế dần dần). 

### Hệ thống chia làm 3 lớp:
1. **Lớp Lõi (Rust Daemon - `automa-core`)**:
   - Sử dụng `tokio` (Multi-threading) và `axum` (HTTP Server).
   - Chạy ngầm tại port tĩnh (vd: `8765`), phục vụ REST API và SSE (Server-Sent Events) cho UI.
2. **Lớp Cầu Nối (Node.js SDK - `@automa/sdk`)**:
   - Nằm trong thư mục `packages/automa-sdk`.
   - Cung cấp các hàm bọc (Wrapper Functions) bằng TypeScript để VS Code gọi API tới Rust Daemon.
3. **Lớp Giao Diện (VS Code Extension - `automa-vscode`)**:
   - Hoạt động như Thin Client. Không nhúng UI nặng. Gọi SDK ở lớp 2 để ra lệnh cho Daemon.

## 3. Lộ trình thực thi (Roadmap)

### Giai đoạn 1: Proof of Concept (PoC)
- [x] Tạo `automa-core` local crate.
- [x] Thiết lập `axum` HTTP Server trả về `/api/health`.
- [x] Tạo `@automa/sdk` gọi thử API.

### Giai đoạn 2: Trình Duyệt & Data
- [ ] Tích hợp `rusqlite` cho Local Vault.
- [ ] Thử nghiệm điều khiển Headless Chrome bằng `chromiumoxide` qua CDP.

### Giai đoạn 3: Hoàn thiện
- [ ] Chuyển đổi toàn bộ Workflow Engine.
- [ ] Tích hợp Tauri tạo bản Automa Desktop độc lập (Horizon 4).
