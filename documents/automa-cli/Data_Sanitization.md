---
title: Data Sanitization
date: 2026-08-05
tags:
  - cli
  - sanitizer
  - architecture
---

# Data Sanitization trong Automa CLI

> [!info]
> Tính năng tự động chuẩn hoá (Sanitize) dữ liệu Workflow và Package trước khi thực thi để đảm bảo tính hợp lệ, sửa các lỗi về cấu trúc, và ngăn ngừa các lỗi crash do ID không hợp lệ gây ra trên Extension.

Tệp nguồn: `automa-cli/src/utils/sanitizer.ts`
Lớp chịu trách nhiệm chính: `WorkflowSanitizer`

## Luồng chuẩn hóa (Sanitization Workflow)

Quá trình sanitize đảm bảo JSON truyền vào hợp lệ, thông qua các bước chính:

1. **Đảm bảo các thuộc tính gốc (Root properties)**
   - Tạo `id` mới (NanoID) nếu workflow/package chưa có ID.
   - Bổ sung `version` mặc định (vd: `1.28.0`).
   - Đảm bảo trường `icon` là kiểu string (đặt thành rỗng nếu sai kiểu).

2. **Cấu trúc lại dữ liệu đồ thị (Graph Structure)**
   - **Đối với Workflow**: Kiểm tra tồn tại `drawflow.nodes` và `drawflow.edges`.
   - **Đối với Package**: Kiểm tra tồn tại `data.nodes` và `data.edges`.
   - Nếu dạng node cũ (object-based nodes) được phát hiện (vd. cấu trúc `Home.data`), nó sẽ được chuẩn hoá thành mảng array.

3. **Gán và map lại NanoIDs cho Nodes**
   - Đảm bảo định dạng ID chuẩn qua regex `^[A-Za-z0-9_-]{4,21}$`. Nếu ID không hợp lệ, CLI sẽ sử dụng hàm `generateShortId()` sinh một ID 21 ký tự ngẫu nhiên.
   - Loại bỏ các ID không hợp lệ, thay bằng ID mới và lưu vào 1 `idMap` để thay thế trên các kết nối (Edges).
   - Xác thực `node.type` phải nằm trong danh sách hỗ trợ (`validTypes`), nếu sai sẽ fallback về `BlockBasic`.
   - Đảm bảo thuộc tính `disableBlock` là boolean (fallback `false`).

4. **Chuẩn hoá Edges (Kết nối)**
   - Tạo ID mới cho các kết nối (Edge) nếu thiếu hoặc sai định dạng.
   - Cập nhật thuộc tính `source` và `target` thông qua `idMap` nếu các node nguồn/đích đã được đổi ID ở bước trên.
   - Cập nhật các handle liên quan (`sourceHandle`, `targetHandle`).

## Lợi ích
- **Tự sửa lỗi (Self-healing)**: Workflow copy/paste sai, thiếu ID, hoặc dạng object-based đời cũ vẫn được sửa tự động.
- **Tính trơn tru (Resilience)**: Tránh lỗi khi inject workflow vào background của Automa Extension do mismatch version hoặc schema.
