# Original User Request

## 2026-07-06T06:45:53Z

<USER_REQUEST>
# Teamwork Project Prompt — Draft

> Status: Ready for launch — awaiting user approval
> Goal: Craft prompt → get user approval → delegate to teamwork_preview

Cập nhật bộ skill Automa và hệ thống file JSON schemas để khắc phục triệt để lỗi chọn sai loại CSS/XPath selector và củng cố quy trình bắt buộc phải lấy (capture) DOM thực tế, tuyệt đối không tự suy diễn HTML.

Working directory: c:\Repository\automa-ecosystem
Integrity mode: development

## Requirements

### R1. Cập nhật tài liệu hướng dẫn (Skill Docs)
Sửa đổi `SKILL.md` và `prompt.md` trong thư mục `.agents/skills/automa` để bổ sung quy định bắt buộc: Khi sử dụng XPath, phải cấu hình trường `findBy: "xpath"`. Nhấn mạnh nguyên tắc cấm tự suy diễn DOM selector dưới mọi hình thức, yêu cầu phải dùng script chuẩn để lấy HTML trước khi viết logic.

### R2. Nâng cấp JSON Schema
Cập nhật file `schemas/automa.schema.json` (nằm trong thư mục `.agents/skills/automa`) để thêm ràng buộc chặt chẽ cho trường `findBy` đối với các khối DOM (Forms, Event-Click...). Nếu người dùng khai báo `selector` chứa các ký tự đặc trưng của XPath (như bắt đầu bằng `//`), schema nên báo lỗi nếu thiếu `findBy: "xpath"`.

### R3. Xây dựng tiện ích HTML Capture Script
Phát triển một script tiêu chuẩn bằng Node.js (sử dụng Puppeteer) đặt trong thư mục `scripts` của bộ skill (tạo thư mục nếu chưa có). Script này nhận đầu vào là một URL, có chức năng khởi tạo trình duyệt (Headless), chờ trang web render xong toàn bộ JavaScript (SPA) và in ra HTML của các thẻ quan trọng (như input, button).

## Acceptance Criteria

### Xác thực lập trình (Programmatic Verification)
- [ ] Script Puppeteer (R3) chạy thành công mà không văng lỗi khi được thực thi (ví dụ: `node scripts/capture.js "https://example.com"` in ra được HTML). Agent phải cung cấp kết quả chạy script trên terminal để chứng minh.
- [ ] Agent tự tạo một script kiểm thử ngắn bằng Node.js (dùng `ajv` hoặc library tương tự) để xác thực (validate) JSON Schema (R2). Script này phải chứng minh được rằng: một file JSON mẫu chứa XPath nhưng thiếu `findBy: "xpath"` sẽ **bị schema từ chối**; và file JSON có đủ thông tin sẽ **được duyệt**.
- [ ] Kiểm tra bằng công cụ grep/search rằng cụm từ `findBy` và lệnh cấm "tự suy diễn selector" đã xuất hiện trong `SKILL.md` và `prompt.md`.
</USER_REQUEST>

## 2026-07-06T07:39:03Z

<USER_REQUEST>
# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Craft prompt → get user approval → delegate to teamwork_preview

Xây dựng công cụ CLI (production-ready) bằng Puppeteer để thực thi ngầm các workflow Automa. Giải quyết triệt để các rào cản kỹ thuật của Manifest V3 (MV3) và ẩn hoàn toàn các giao diện popup mặc định của extension.

Working directory: C:\Repository\automa-ecosystem\automa-cli
Integrity mode: demo

## Requirements

### R1. Phân tích Thiết kế & Rủi ro (Mindmap & Risk Analysis)
Tạo một tài liệu `design_and_risks.md` bao gồm một sơ đồ tư duy (Mermaid Mindmap) mô tả kiến trúc của quá trình khởi chạy. Tài liệu phải có phần phân tích rủi ro (Risk Usecases) và đưa ra giải pháp kỹ thuật cụ thể cho 4 vấn đề:
1. Giới hạn vòng đời của Service Worker trong Manifest V3 (dễ bị sleep).
2. Hành vi của Default Tab trong Chrome khi chạy qua Puppeteer.
3. Độ trễ khởi tạo của Background Listeners.
4. Cách chặn/bypass việc hiển thị `popup.html` và `params.html` khi trigger workflow.

### R2. Phát triển CLI Package
Xây dựng một package Node.js hoàn chỉnh (`automa-cli`) sử dụng Puppeteer. CLI phải có khả năng nhận tham số từ terminal (ví dụ: đường dẫn file workflow hoặc ID), tự động load unpacked extension Automa, và trigger workflow chạy ngầm hoàn toàn (background) mà không hiện bất kỳ giao diện người dùng nào của extension.

## Acceptance Criteria

### Xác thực lập trình (Programmatic Verification)
- [ ] **E2E Test**: Agent phải tạo một script `verify_cli.js`. Script này tự động gọi lệnh CLI chạy một workflow mẫu, và kiểm chứng qua log/file output rằng workflow đã chạy thành công từ đầu đến cuối mà không bị treo do MV3 Service Worker sleep.
- [ ] **No-UI Assertion**: Script `verify_cli.js` phải có cơ chế kiểm tra (bắt sự kiện page created hoặc duyệt DOM) để assert (khẳng định) chắc chắn rằng `popup.html` hoặc `params.html` KHÔNG HỀ được render hay hiển thị trong suốt vòng đời chạy lệnh.
- [ ] **Tài liệu**: File `design_and_risks.md` tồn tại, chứa đúng định dạng ````mermaid mindmap```` và có đủ 4 mục giải pháp (mitigations) cho 4 rủi ro đã nêu.
</USER_REQUEST>
