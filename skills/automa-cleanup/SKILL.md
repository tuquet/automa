---
name: automa-cleanup
description: Quy chuẩn và quy trình 4 bước (SOP) dọn dẹp file rác, file nháp, build artifacts cũ và tối ưu hóa không gian Monorepo mà không gây lỗi build hay mất mát dữ liệu quan trọng.
---

# Quy Chuẩn & Quy Trình Dọn Dẹp File Rác (Automa Ecosystem Cleanup)

## 1. Mục Đích & Phạm Vi
Kỹ năng này BẮT BUỘC KÍCH HOẠT bất cứ khi nào người dùng yêu cầu:
- "dọn dẹp file rác", "clean up", "purge scratch", "xóa file thừa", hoặc "tối ưu dung lượng repo".

---

## 2. Danh Mục Bảo Vệ Tuyệt Đối (PROTECTED WHITELIST - CẤM XÓA)
Khi thực hiện dọn dẹp, AI Agent **TUYỆT ĐỐI KHÔNG ĐƯỢC XÓA** các tệp sau dù chúng nằm trong danh sách gitignore hoặc có vẻ là file tạm:

1. **`apps/webe/src/utils/getPassKey.js`**: Khóa mã hóa bắt buộc để Webpack biên dịch được `apps/webe` và runner.
2. **`.changeset/*.md`**: Lịch sử release phân tán của packages & apps, chỉ được tiêu thụ bởi lệnh release chính thức.
3. **Các file cấu hình cốt lõi**: `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `turbo.json`, `Cargo.lock`, `Cargo.toml`, `.vscode/*`, `biome.json`.
4. **Các tệp mã nguồn trong `src/`**: TUYỆT ĐỐI KHÔNG tự ý xóa nếu chưa dùng `grep_search` xác nhận không còn bất kỳ module nào import.

---

## 3. Ma Trận Phân Loại Rác (Garbage Taxonomy)

| Cấp độ | Định dạng tệp | Hành động |
| :--- | :--- | :--- |
| **Tier 1 (Rác Tuyệt Đối)** | `*.vsix` cũ, `openapi-ts-error-*.log`, `npm-debug.log*`, `Thumbs.db`, `.DS_Store`, `*.orig`, `*.bak`, `*.swp` | Xóa ngay không cần đối chiếu |
| **Tier 2 (Rác Phiên Làm Việc)** | `apps/core/scratch/*`, `apps/webe/scratch/*`, các script nháp tạm thời ở root | Xóa sạch sau khi phiên debug kết thúc |
| **Tier 3 (Legacy Dead Assets)** | Các file HTML CDN cũ, thư viện không còn import trong `apps/webe/src/assets/` | Dùng `grep_search` kiểm tra, nếu 0 reference thì xóa |

---

## 4. Quy Trình 4 Bước Chuẩn (SOP - Standard Operating Procedure)

### Bước 1: Quét & Phát Hiện (Discovery Phase)
Sử dụng `find_by_name` để quét các danh mục:
- Quét package bundles cũ: `Pattern: "*.vsix"`
- Quét error logs: `Pattern: "*.log"`
- Quét scratch files: `SearchDirectory: "*/scratch"`

### Bước 2: Kiểm Tra An Toàn (Safety Cross-Check)
- Đối với các file asset hoặc code nghi vấn dead-code, BẮT BUỘC dùng `grep_search` để kiểm tra có file `.ts`, `.rs`, `.vue`, `.json` nào đang gọi tới hay không.

### Bước 3: Lập Bảng Thống Kê & Báo Cáo (Dry-Run Audit Report)
Liệt kê chi tiết danh sách file dự kiến xóa kèm dung lượng ước tính để người dùng nắm rõ.

### Bước 4: Thực Thi & Xác Minh Tự Động (Purge & Test)
1. Thực hiện xóa các file đã xác nhận.
2. **BẮT BUỘC** chạy bộ Unified Test Suite từ root:
   ```bash
   node scripts/test-all.mjs
   ```
3. Xác nhận toàn bộ 3 test suites (`Rust Core`, `VS Code Vitest`, `OpenAPI Linter`) đều đạt `[✔ PASSED]` trước khi hoàn thành công việc.
