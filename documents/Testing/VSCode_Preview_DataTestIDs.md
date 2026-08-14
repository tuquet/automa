# Danh sách `data-testid` cho các Custom Editor Previews (Automa VSCode)

Tài liệu này cung cấp thống kê chi tiết về các thuộc tính `data-testid` đã được thêm vào các Webview Panel trong `automa-vscode`. Các ID này nhằm phục vụ mục đích Automation Testing (E2E) và đảm bảo chất lượng luồng giao tiếp giữa UI với Extension Host (rồi tới Daemon cục bộ).

## Nguyên tắc định danh
Tất cả các `data-testid` trên màn hình VS Code Preview đều tuân thủ cấu trúc:
`vscode-[type]-preview-[action]-btn`

---

## 1. Màn hình Workflow Preview (`workflow-preview.html`)
Được hiển thị khi click vào các file `*.workflow.json`.

| data-testid | Mô tả hành vi | Lệnh gửi về Extension Host (`message.type` / `command`) |
| --- | --- | --- |
| `vscode-workflow-preview-save-btn` | Lưu lại các tham số mặc định và settings của workflow. | `save-workflow-properties` |
| `vscode-workflow-preview-edit-btn` | Mở workflow này trên màn hình Automa Studio. | `openStudio` |
| `vscode-workflow-preview-run-btn` | Bắt đầu chạy workflow với tham số cấu hình trên form. | `runWorkflow` |

---

## 2. Màn hình Package Preview (`package-preview.html`)
Được hiển thị khi click vào các file `*.package.json`.

| data-testid | Mô tả hành vi | Lệnh gửi về Extension Host (`message.type` / `command`) |
| --- | --- | --- |
| `vscode-package-preview-save-btn` | Lưu cấu hình package | `save-package-properties` |
| `vscode-package-preview-edit-btn` | Mở package này trên màn hình Automa Studio. | `openStudio` |

---

## 3. Màn hình Campaign Preview (`Campaign-preview.html`)
Được hiển thị khi click vào các file `*.Campaign.json`.

| data-testid | Mô tả hành vi | Lệnh gửi về Extension Host (`message.type` / `command`) |
| --- | --- | --- |
| `vscode-Campaign-preview-save-btn` | Lưu file cấu hình Campaign (Campaign Members & Global Variables). | `save-Campaign` |
| `vscode-Campaign-preview-run-btn` | Gửi tín hiệu thực thi đồng loạt (Run) Campaign. | `run-Campaign` |
| `vscode-Campaign-preview-stop-btn` | Gửi tín hiệu dừng (Stop) quá trình đang chạy của Campaign. | `stop-Campaign` |
| `vscode-Campaign-preview-format-json-btn` | Định dạng lại chuỗi JSON Global Variables cho chuẩn. | N/A (Xử lý trực tiếp trên giao diện) |
| `vscode-Campaign-preview-add-member-btn` | Thêm một Browser Member mới vào danh sách. | N/A (State Vue nội bộ) |
| `vscode-Campaign-preview-delete-member-btn`| Xóa một Browser Member khỏi danh sách. | N/A (State Vue nội bộ) |
| `vscode-Campaign-preview-add-task-btn` | Thêm một Task execution mới vào trong 1 Member. | N/A (State Vue nội bộ) |
| `vscode-Campaign-preview-delete-task-btn`| Xóa một Task execution ra khỏi 1 Member. | N/A (State Vue nội bộ) |

---

## 4. Màn hình Profile Preview (`profile-preview.html`)
Được hiển thị khi click vào các file `*.profile.json` (Browser Profiles) và `*.table.json` (Tables).

| data-testid | Mô tả hành vi | Lệnh gửi về Extension Host (`message.type` / `command`) |
| --- | --- | --- |
| `vscode-profile-preview-form-mode-btn` | Chuyển đổi sang giao diện nhập liệu dạng Form (chỉ cho Profile). | N/A |
| `vscode-profile-preview-json-mode-btn` | Chuyển đổi sang giao diện hiển thị CodeMirror JSON. | N/A |
| `vscode-profile-preview-format-json-btn`| Xóa các khoảng trắng, định dạng đẹp lại CodeMirror JSON. | N/A |
| `vscode-profile-preview-save-btn` | Lưu lại JSON profile đang hiện hành. | `save-profile` |
| `vscode-profile-preview-add-entry-btn` | Thêm một data entry mới (trong trường hợp Array of Objects / variables). | N/A |
| `vscode-profile-preview-delete-entry-btn`| Xóa một data entry. | N/A |

---

## Hướng dẫn dùng Test script (Ví dụ với Playwright)
Khi thực hiện test các Provider của VS Code thông qua Webview Test, bạn có thể tham chiếu DOM locator như sau:

```javascript
// Click nút "Run Workflow" trong Preview
await page.locator('[data-testid="vscode-workflow-preview-run-btn"]').click();
```
