---
name: automa-cli
description: "Thư mục gốc chứa các kỹ năng và giao thức thực thi của Automa CLI. Tham khảo các thư mục con cho từng tác vụ cụ thể."
---

# Automa CLI (`automa-cli`) - Mục lục & Giao thức Cốt lõi

**BẮT BUỘC XEM** MỤC LỤC TỔNG HỢP toàn bộ quy trình, kiến trúc và kỹ thuật liên quan đến **Automa CLI** (`automa-cli`).

**BẮT BUỘC ĐIỀU HƯỚNG** tới các kỹ năng con (sub-skills) tương ứng bên dưới theo yêu cầu công việc:

## Danh sách Kỹ năng con

- 💻 **[Automa CLI Run (automa-cli-run)](./automa-cli-run/SKILL.md)**
  - **Mục đích:** **BẮT BUỘC TUÂN THEO** QUY TRÌNH xác minh phụ thuộc và chạy quy trình làm việc (workflow).

- 🛠️ **[Automa CLI Studio (automa-cli-studio)](./automa-cli-studio/SKILL.md)**
  - **Mục đích:** **BẮT BUỘC TUÂN THEO** QUY TRÌNH tiêm mã và mở tệp cấu hình cục bộ dưới dạng giao diện Studio kéo thả.

- 🔍 **[Automa CLI Lint (automa-cli-lint)](./automa-cli-lint/SKILL.md)**
  - **Mục đích:** **BẮT BUỘC ÁP DỤNG** ĐẶC TẢ kỹ thuật cho tính năng kiểm tra lỗi cấu trúc và ngữ nghĩa.

- 🌐 **[Automa CLI Browser Launcher (automa-cli-browser-launcher)](./automa-cli-browser-launcher/SKILL.md)**
  - **Mục đích:** **BẮT BUỘC SỬ DỤNG** kiến trúc gọi API tới Daemon để khởi chạy trình duyệt thay vì dùng `child_process`.

---

## ⚡ Giao thức Cốt lõi: Automa Extension UI Bypass

> [!IMPORTANT]
> **Quy tắc BẮT BUỘC khi mở giao diện Extension (Studio/Dashboard):**

1. **TUYỆT ĐỐI KHÔNG DÙNG `page.goto` từ tab thông thường**: Giao diện Automa **CHẮC CHẮN SẼ** tự đóng tab nếu không phải cửa sổ dạng popup.
2. **TUYỆT ĐỐI KHÔNG DÙNG tham số URL để bỏ qua (như `?bypass=1`)**: Cách này **CHẮC CHẮN SẼ** làm hỏng trạng thái ứng dụng và bỏ qua luồng tải dữ liệu chuẩn.
3. **GIẢI PHÁP CHUẨN:** **LUÔN LUÔN BẮT BUỘC TIÊM** mã kịch bản vào Background Service Worker để tạo một cửa sổ `popup` chuẩn gốc.

---

## 🏗️ Kiến trúc Cốt lõi: Thin Client & Daemon

- **`VaultContextResolver`**: **BẮT BUỘC DÙNG** dịch vụ này để xác định cấu hình kho lưu trữ từ đường dẫn tuyệt đối. **TUYỆT ĐỐI KHÔNG** lặp lại mã quét thư mục trong từng lệnh.
- **`ExecutionManager`**: **BẮT BUỘC SỬ DỤNG** lớp quản lý chung để xử lý thử lại (retries) và tiêm phụ thuộc. **BẮT BUỘC TÁCH BIỆT** ranh giới trách nhiệm.
- **`WorkflowLoaderService`**: Khi tải quy trình từ GitHub, **BẮT BUỘC DÙNG** HTTP GET trực tiếp nội dung gốc vào bộ nhớ. **TUYỆT ĐỐI KHÔNG** dùng `git clone`.
- **`SyncWatcher`**: KHI chạy ở chế độ Bảng điều khiển (Dashboard), mọi thay đổi trên giao diện **BẮT BUỘC LƯU** vào bộ nhớ cục bộ và được ghi ra tệp JSON.
- **`DaemonManager`**: BẮT BUỘC tuân thủ kiến trúc Thin Client & Daemon hiện đại. CLI đóng vai trò Thin Client, **BẮT BUỘC GỌI API** của Daemon để xử lý tác vụ nặng (khởi chạy trình duyệt, quản lý tiến trình). **TUYỆT ĐỐI KHÔNG** dùng `child_process` trực tiếp trong CLI.
