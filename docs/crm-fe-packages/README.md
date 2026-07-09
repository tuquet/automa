# Danh sách Packages cho CRM-FE

Dưới đây là danh sách thống kê các thư viện Packages hiện tại dành cho dự án CRM-FE, được lưu tại Local DB.
Bạn có thể copy mã JSON từ các file tương ứng trong thư mục này và paste trực tiếp vào giao diện Workflow của Automa để sử dụng.

| ID (File JSON) | Tên Package | File JSON | Mô tả (Nhiệm vụ) | Đầu vào (Inputs) | Đầu ra (Outputs) | Dùng trong Workflow |
|---|---|---|---|---|---|---|
| `pkg-auth-logout` | `[auth] Logout` | [pkg-auth-logout.json](./pkg-auth-logout.json) | Hành động logout (Click menu, chờ, click nút logout) | `start` | `end` | [\[wf-login\] Login](../crm-fe-workflows/wf-login.json) |
| `jzZa_ycRZs8XGsrz-HJwg` | `[form] Login` | [pkg-form-login.json](./pkg-form-login.json) | Sử dụng global data input form (Điền Username, Password, và bấm Đăng nhập) | `valid`, `invalid_credentials`, `invalid_regex` | `200`, `401`, `400` | [\[wf-login\] Login](../crm-fe-workflows/wf-login.json) |
| `iMMLDg_-1mqZQTHHVDKxt` | `[check] Authenticate` | [pkg-check-authenticate.json](./pkg-check-authenticate.json) | Kiểm tra trạng thái xác thực (Check sự tồn tại của nút bấm) | `Input` | `True`, `False` | [\[wf-login\] Login](../crm-fe-workflows/wf-login.json) |
| `pkg-nav-sales-team` | `[nav] Go to Sales Team` | [pkg-nav-sales-team.json](./pkg-nav-sales-team.json) | Chuyển hướng an toàn tới trang Sales Team Configuration | `start` | `end` | *(Chưa dùng)* |
| `pkg-nav-codebook` | `[nav] Go to Codebook` | [pkg-nav-codebook.json](./pkg-nav-codebook.json) | Chuyển hướng an toàn tới trang Cấu hình Danh mục | `start` | `end` | *(Chưa dùng)* |
| `pkg-nav-team-detail` | `[nav] Go to Team Detail` | [pkg-nav-team-detail.json](./pkg-nav-team-detail.json) | Chuyển hướng tới chi tiết Team. Yêu cầu truyền biến `{{variables.team_id}}` | `start` | `end` | *(Chưa dùng)* |
| `pkg-nav-employee-detail` | `[nav] Go to Employee Detail` | [pkg-nav-employee-detail.json](./pkg-nav-employee-detail.json) | Chuyển hướng tới chi tiết Employee. Yêu cầu truyền biến `{{variables.employee_id}}` | `start` | `end` | *(Chưa dùng)* |
| `pkg-scrape-sales-teams` | `[scrape] Extract Sales Teams` | [pkg-scrape-sales-teams.json](./pkg-scrape-sales-teams.json) | Quét bảng danh sách các Team hiện có và lưu vào biến `{{variables.scraped_sales_teams}}` | `start` | `end` | *(Chưa dùng)* |
| `pkg-action-create-team` | `[action] Create Sales Team` | [pkg-action-create-team.json](./pkg-action-create-team.json) | Tự động điền Form tạo Team dựa trên Input variables | `start` | `end` | *(Chưa dùng)* |
| `pkg-scrape-employees` | `[scrape] Extract Employees` | [pkg-scrape-employees.json](./pkg-scrape-employees.json) | Lấy danh sách nhân sự của một Team và lưu vào biến `{{variables.scraped_employees}}` | `start` | `end` | *(Chưa dùng)* |
| `pkg-action-add-employee` | `[action] Add Employee` | [pkg-action-add-employee.json](./pkg-action-add-employee.json) | Thêm nhân viên mới vào hệ thống/team (Nhận biến `add_employee_ldap`) | `start` | `end` | *(Chưa dùng)* |
| `pkg-scrape-codebook-categories` | `[scrape] Extract Codebook Categories` | [pkg-scrape-codebook-categories.json](./pkg-scrape-codebook-categories.json) | Quét danh sách Code Type và lưu vào `{{variables.scraped_codebook_categories}}` | `start` | `end` | *(Chưa dùng)* |
| `pkg-action-select-codebook-category` | `[action] Select Category` | [pkg-action-select-codebook-category.json](./pkg-action-select-codebook-category.json) | Click vào một Category theo biến `{{variables.select_code_type}}` | `start` | `end` | *(Chưa dùng)* |
| `pkg-scrape-codebook-properties` | `[scrape] Extract Category Details` | [pkg-scrape-codebook-properties.json](./pkg-scrape-codebook-properties.json) | Quét các giá trị trong Drawer của Category và lưu vào `{{variables.scraped_codebook_properties}}` | `start` | `end` | *(Chưa dùng)* |
| `pkg-action-add-codebook-property` | `[action] Add Property` | [pkg-action-add-codebook-property.json](./pkg-action-add-codebook-property.json) | Thêm giá trị danh mục mới dựa vào biến `add_property_code` và `add_property_name` | `start` | `end` | *(Chưa dùng)* |

---
*Ghi chú: File này sẽ được cập nhật liên tục khi có thêm các Packages mới được định nghĩa trên giao diện.*
