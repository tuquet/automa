# 🩺 Software Requirements Specification (SRS): Linter Diagnostics & Auto-Sanitization

> [!IMPORTANT]
> ### 🔗 Core Daemon API Endpoints (`http://127.0.0.1:8765`)
> - `POST /api/lint` — *Phân tích cú pháp JSON AST, kiểm tra tính toàn vẹn của đồ thị DAG nodes/edges, phát hiện lỗi Schema và trả về danh sách vị trí vi phạm*

---

## 1. Executive Summary & Scope
Đặc tả yêu cầu phần mềm cho bộ phân tích cú pháp tĩnh (**Linter Engine**) và cơ chế tự động sửa lỗi cấu trúc (**Auto-Sanitizer**) trong **Automa VS Code**. Giúp phát hiện sớm các lỗi sai lệch Schema JSON, khối node bị mất kết nối, biến chưa định nghĩa và tự động nâng cấp cấu trúc file cũ.

- **Thành Phần Chính**: [`lintCheck.ts`](../../src/commands/lintCheck.ts) & [`Sanitizer.ts`](../../src/core/Sanitizer.ts)

---

## 2. Functional Requirements (FR)

### FR-1: Chẩn Đoán Lỗi Cú Pháp Thời Gian Thực (VS Code Diagnostics)
- **FR-1.1 Tích Hợp `vscode.Diagnostic`**: Khi người dùng chỉnh sửa tệp `*.workflow.json` hoặc `*.package.json`, Linter tự động kiểm tra và ghim lỗi/cảnh báo trực tiếp dưới dạng gạch chân đỏ (Error) hoặc vàng (Warning).
- **FR-1.2 Phân Cấp Mức Độ (Severity)**:
  - `Error`: Thiếu trường bắt buộc (ví dụ: `drawflow` rỗng, thiếu root node).
  - `Warning`: Khối node không có kết nối đầu ra, biến chưa được gán giá trị mặc định.
  - `Info`: Gợi ý tối ưu hóa hiệu năng hoặc cập nhật phiên bản schema.

### FR-2: Tự Động Nâng Cấp & Làm Sạch (Auto-Sanitizer)
- **FR-2.1 Thay Thế Node ID Cũ**: Tự động chuyển đổi các ID legacy như `n1`, `n2` thành `nanoid` chuẩn để tương thích hoàn hảo với VueFlow Canvas.
- **FR-2.2 Bổ Sung Thuộc Tính Thiếu**: Tự động chèn `version: "1.0.0"` hoặc `type: "BlockBasic"` nếu tệp bị thiếu ở root.

---

## 3. RESTful API & Backend Endpoints Specification (`automa-core`)

### 3.1 Dịch Vụ Kiểm Tra Tính Hợp Lệ Của Schema (Workflow Linting)
- **Endpoint**: `POST /api/lint`
- **Mô tả**: Daemon phân tích cú pháp JSON AST, kiểm tra tính toàn vẹn của đồ thị luồng (DAG nodes & edges) và đối chiếu với JSON Schema chuẩn của Automa.
- **Request Body**:
```json
{
  "workflow_json": {
    "name": "My Scraper",
    "drawflow": {
      "Home": {
        "data": {}
      }
    }
  }
}
```
- **Response `200 OK` (Khi có cảnh báo / lỗi)**:
```json
{
  "valid": false,
  "issues": [
    {
      "node_id": "n1",
      "severity": "warning",
      "message": "Node ID 'n1' uses deprecated numeric identifier format. Consider sanitizing to nanoid.",
      "line": 14,
      "column": 5
    },
    {
      "node_id": "trigger_node",
      "severity": "error",
      "message": "Trigger node has no outgoing connection edge.",
      "line": 28,
      "column": 12
    }
  ]
}
```

---

## 4. Non-Functional Requirements (NFR)

1. **Hiệu Năng Phân Tích Cú Pháp (Debounced Parsing)**: Linter chỉ thực thi sau khi người dùng ngừng gõ 300ms (debounce) để tránh quá tải CPU.
2. **Nguyên Tắc Dung Thương (Permissive Editor / Strict Runner)**: Trong giao diện soạn thảo, sai lệch cú pháp nhẹ chỉ hiển thị dưới dạng Warnings để người dùng thoải mái chỉnh sửa.

---

## 5. Acceptance Criteria (BDD Scenarios)

```gherkin
Scenario: Phát hiện thiếu ID trong tệp workflow
  Given tệp "test.workflow.json" có node với id = "n1"
  When người dùng mở tệp trên VS Code
  Then Linter gọi POST /api/lint và hiển thị Warning "Node ID 'n1' is deprecated. Click Quick Fix to sanitize."
  When người dùng chọn "Fix Workflow IDs"
  Then node ID được tự động thay thế bằng nanoid hợp lệ
```
