# Task: Self-Improvement Loop
## 1. Mục tiêu hiện tại
Thực hiện quá trình tự cải tiến, tối ưu code theo quy trình:
1. Đọc kế hoạch và tình trạng task.
2. Deep Code Review (Review một phần/vài file theo góc nhìn chuyên sâu).
3. Thực thi (Bug fix, tính năng, test).
4. Cập nhật và báo cáo.

## 2. Các điểm mù nghiêm trọng (Blindspots) cần cải thiện
- **RunCommand.ts**: Vi phạm SRP nặng nề. Hàm `action` chứa logic của 5-6 domain khác nhau (I/O, Config, Validation, Execution, CLI Interaction).
- **RunCommand.ts**: Logic đọc `.vscode/settings.json` đang duplicate hoặc hardcode inline, nên chuyển vào `ConfigManager`.

## 3. Trạng thái thực thi
- [x] Khởi tạo & Quản lý tiến độ
- [x] Deep Code Review
- [x] Thực thi (Fix/Feature/Test)
- [ ] Báo cáo & Tạo Pull Request
