# Danh sách Workflows cho CRM-FE

Dưới đây là danh sách thống kê các Workflows hiện tại dành cho dự án CRM-FE, được lưu tại Local DB.
Các Workflow này chứa các Block `package` liên kết tới các package trong thư mục `crm-fe-packages`. Bạn có thể kiểm tra (Review) mã JSON để xem tính khớp nối của ID (packageId) giữa hai bên.

| ID (File JSON) | Tên Workflow | Mô tả Workflow | Input/Output | Dependency Packages | Link xem chi tiết |
|---|---|---|---|---|---|
| `wf-login` | `[wf-login] Login` | Workflow Login chính, map mã nhân viên ra username và gọi form login | Input: `{{variables.$$loginUrl}}`, `{{variables.employeeCode}}`, `{{secrets@commonPassword}}` <br> Output: `200`, `401`, `400` | [\[form\] Login](../crm-fe-packages/pkg-form-login.json), [\[check\] Authenticate](../crm-fe-packages/pkg-check-authenticate.json), [\[auth\] Logout](../crm-fe-packages/pkg-auth-logout.json) | [wf-login.json](./wf-login.json) |

---
*Ghi chú: File này sẽ được cập nhật liên tục khi có thêm Workflow được định nghĩa.*
