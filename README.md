<div align="center">
  <img src="https://tuquet.github.io/icons/automa.svg" width="76" height="76" alt="Automa Logo" />
  <h1>Specter Automa</h1>
  <p><strong>Next-Generation Workflow Orchestration & Headless Automation Platform</strong></p>

  <p>
    <a href="https://tuquet.github.io/docs/automa/"><img src="https://img.shields.io/badge/Docs-VitePress%20Hub-blue.svg" alt="Documentation Hub" /></a>
    <a href="https://github.com/tuquet/scoop-bucket"><img src="https://img.shields.io/badge/Scoop-specter-brightgreen.svg" alt="Scoop" /></a>
    <a href="https://www.rust-lang.org/"><img src="https://img.shields.io/badge/Rust-Axum%2FTokio-orange.svg" alt="Rust" /></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License" /></a>
  </p>

  <p>
    <strong><a href="https://tuquet.github.io/docs/automa/">📖 Đọc toàn bộ tài liệu kỹ thuật tại Documentation Hub &rarr;</a></strong>
  </p>
</div>

---

## 📌 Tổng Quan (Overview)

**Specter Automa** là nền tảng điều phối và tự động hóa kịch bản đa luồng thế hệ mới. Hệ thống kết hợp giữa đồ thị thực thi luồng công việc Directed Acyclic Graph (DAG) trực quan và Chrome Extension Runner (Manifest V3) chạy ngầm siêu nhẹ, được giám sát bởi Rust CDP core.

* **Offline-First & Local Storage**: Lưu trữ và thực thi workflow trực tiếp từ cơ sở dữ liệu SQLite cục bộ tại `~/.specter/automa/automa.sqlite`.
* **Headless Stealth Mode**: Tự động hóa tàng hình hoàn toàn qua pure Rust CDP, vô hiệu hóa mọi cơ chế phát hiện tự động.

## ⚡ Sử Dụng Nhanh (Quickstart)

```bash
# Thực thi một kịch bản tự động hóa từ kho lưu trữ cục bộ
specter automa run --workflow my-flow.json

# Khởi chạy daemon điều phối CDP ngầm
specter automa start
```

## 📚 Tài Liệu Kỹ Thuật Tập Trung (SSOT)

Toàn bộ đặc tả cấu trúc DAG, kiến trúc Monorepo, giao thức Pure Rust CDP và hướng dẫn tích hợp được bảo trì duy nhất tại Documentation Hub:

👉 **[https://tuquet.github.io/docs/automa/](https://tuquet.github.io/docs/automa/)**
