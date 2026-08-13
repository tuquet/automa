<div align="center">
  <h1>Workflow Runner (workflow-runner)</h1>
  <p><strong>Động cơ Thực thi Kịch bản Độc lập (Decoupled Execution Engine)</strong></p>
</div>

---

`workflow-runner` là gói thư viện (Package) cốt lõi chịu trách nhiệm biên dịch và chạy các quy trình tự động hóa của Hệ sinh thái Automa.

Thay vì nhúng chặt logic chạy vào `automa-cli` hay giao diện mở rộng (Extension), chúng tôi đã tách rời (decouple) toàn bộ cơ chế thực thi thành gói độc lập này. Điều này tuân thủ nguyên tắc thiết kế **SRP (Single Responsibility Principle)** chuẩn Doanh nghiệp.

---

## 🏗️ Kiến Trúc & Vai Trò

Gói này đóng vai trò là "Não bộ xử lý" với các nhiệm vụ chính:

1. **Phân tích Cú pháp (Parsing & Validation):** Đọc file JSON của Workflow/Campaign, xác thực cấu trúc (Schema) bằng Linter và tự động làm sạch (Auto-Sanitization) các lỗi như Node ID cũ (dạng `n1`).
2. **Điều phối Luồng (Execution Graph):** Khởi tạo cây đồ thị (Graph) từ các Nodes và Edges, tính toán đường đi và điều phối thứ tự chạy song song hay tuần tự.
3. **Quản lý Vòng Đời (Lifecycle Hook):** Bắn các sự kiện (Events) chi tiết trong suốt quá trình chạy như: `onNodeStart`, `onNodeSuccess`, `onNodeError`, `onWorkflowFinish`.
4. **Adapter Đa Nền Tảng (Agnostic):** Nhờ việc tách rời, Runner này có thể được gắn (plug) vào bất kỳ môi trường nào (Chạy trên Node.js Daemon qua `automa-cli`, chạy trên Browser Worker, hoặc tích hợp vào hạ tầng Cloud Runner sau này).

## 🚀 Chiến Lược Chuyển Đổi Tương Lai (Horizon 3)
Theo định hướng của [Roadmap Hệ sinh thái](../../documents/Core/product_strategy.md), mã nguồn Node.js của gói này sẽ là tham chiếu gốc để đội ngũ phát triển tiến hành viết lại bằng **Native Rust (automa-core)**, hướng tới mục tiêu Tốc độ thực thi tính bằng giây (Millisecond) và kiến trúc không phụ thuộc (Zero-Dependency).
