# Supabase Integration Roadmap

This document tracks the progress of migrating Automa's local storage entities to a centralized Supabase cloud backend, enabling real-time cross-browser synchronization.

## 🟢 Completed (Đã hoàn thành)
- [x] **Workflows**: Đồng bộ toàn bộ dữ liệu luồng kịch bản (Create, Update, Delete) với thuật toán Last Write Wins (LWW).
- [x] **Folders**: Đồng bộ thư mục chứa các workflow và quản lý cấu trúc thư mục.
- [x] **Workflow Logs (Lịch sử chạy)**: Đồng bộ lịch sử thực thi, Context Data, Variable outputs.
- [x] **Workflow Snapshots**: Lưu trữ hình ảnh base64 chụp từ workflow lên Supabase Storage bucket (`workflow_snapshots`).
- [x] **Variables (Biến toàn cục)**: Đồng bộ các biến cấu hình tĩnh dùng chung cho các workflow (nằm trong tab Variables). 
- [x] **Packages / Saved Blocks**: Đồng bộ custom blocks hoặc NPM packages cài thêm (Mặc định được share nội bộ 100%).

## 🟡 In Progress (Đang thực hiện)
- [ ] (Trống)

## 🔴 Pending (Chưa thực hiện)
- [ ] **Storage / Data Tables (Bảng dữ liệu)**: Đồng bộ dữ liệu cào được dạng bảng biểu (Tables & Collections). Cần thiết kế lược đồ quan hệ để tối ưu json/jsonb.
- [ ] **Credentials (Chứng chỉ/API Key)**: Cần cơ chế mã hoá đầu cuối (E2EE) hoặc mã hóa trước khi đưa lên cloud để đảm bảo an toàn.
- [ ] **Settings / UI States**: Đồng bộ giao diện (Dark/Light mode), Pinned workflows và trạng thái UI.
- [ ] **Team / Shared / Hosted Workflows**: Rewrite lại API routing từ `api.automa.site` về Supabase (Local/Self-hosted) để tự quản lý đội nhóm nội bộ.
