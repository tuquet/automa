# 📑 Automa Workflow Request Template

> **Ghi chú cho AI Agent:** Khi người dùng yêu cầu tạo mới hoặc sửa một Automa Workflow nhưng thông tin đầu vào quá sơ sài (đặc biệt là thiếu phần tử DOM hoặc biến số), AI **BẮT BUỘC** phải yêu cầu người dùng điền theo biểu mẫu này trước khi tiến hành sinh code JSON. Nếu người dùng từ chối, AI phải cảnh báo về rủi ro sai sót (hallucination) do tự suy diễn DOM.

---

## 1. 🎯 Thông tin cơ bản (Metadata)
- **Tên Workflow:** (Ví dụ: Tự động tải báo cáo doanh thu)
- **Mục tiêu/Mô tả:** (Ví dụ: Đăng nhập vào hệ thống CRM, điều hướng đến trang báo cáo và nhấn nút Tải xuống)
- **URL Bắt đầu:** (Ví dụ: https://crm.example.com/login)
- **Cách Trigger:** (Ví dụ: Chạy thủ công / Chạy theo lịch hẹn / Chạy khi mở trang web cụ thể)

## 2. 🧩 Biến số (Variables / Parameters)
Liệt kê các dữ liệu thay đổi cần truyền vào (nếu có).
- \`username\`: (Ví dụ: tài khoản đăng nhập)
- \`password\`: (Ví dụ: mật khẩu)
- \`date_range\`: (Ví dụ: 7 days)

## 3. 🔍 Captured DOM Elements (RẤT QUAN TRỌNG)
Liệt kê chính xác CSS Selector hoặc XPath của TẤT CẢ các thành phần giao diện sẽ tương tác. *Tuyệt đối không để AI tự đoán.*
Định dạng: \`[Tên phần tử] - [Loại Selector: CSS/XPath] - [Giá trị]\`

**Ví dụ:**
- Ô nhập Tài khoản - CSS - \`input#username-field\`
- Ô nhập Mật khẩu - CSS - \`input[name="pwd"]\`
- Nút Đăng nhập - XPath - \`//button[contains(text(), 'Log In')]\`
- Nút Tải Báo cáo - CSS - \`.download-btn.active\`

## 4. 📝 Kịch bản chi tiết (Step-by-step Logic)
Mô tả tuần tự các hành động (Có thể dùng mã giả, gạch đầu dòng hoặc ngôn ngữ tự nhiên). Nêu rõ các điều kiện rẽ nhánh (nếu có).

**Ví dụ:**
1. Mở trang URL Bắt đầu.
2. Kiểm tra nếu thấy "Nút Đăng nhập":
   - Nhập \`username\` vào Ô nhập Tài khoản.
   - Nhập \`password\` vào Ô nhập Mật khẩu.
   - Bấm Nút Đăng nhập.
   - Đợi trang tải xong.
3. Nếu không thấy Nút Đăng nhập (nghĩa là đã login sẵn), bỏ qua bước 2.
4. Điều hướng sang URL: \`https://crm.example.com/reports\`
5. Bấm Nút Tải Báo cáo.
6. Kết thúc workflow.
