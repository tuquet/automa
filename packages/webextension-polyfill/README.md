<div align="center">
  <h1>WebExtension Polyfill (Dummy/Alias Package)</h1>
  <p><strong>Gói Giải Quyết Phụ Thuộc (Dependency Resolution) Cho Cơ Chế Zero-Polyfill</strong></p>
</div>

---

> [!WARNING]
> Đây **KHÔNG PHẢI** là mã nguồn gốc của thư viện `webextension-polyfill` từ Mozilla. Đây là một gói giả (Dummy Package) được thiết kế đặc thù cho Hệ sinh thái Automa.

## 🚨 Vấn Đề Lịch Sử
Trong kho lưu trữ upstream gốc (`AutomaApp/automa`), thư viện `webextension-polyfill` được sử dụng để bọc các API trình duyệt. Tuy nhiên, kiến trúc này đã gây ra **lỗi Crash diện rộng** trên các phiên bản Chrome v129+ do xung đột nội tại với Storage API.

## 🛠 Giải Pháp Của Chúng Ta (Zero-Polyfill)
Để giải quyết dứt điểm vấn đề mà không phải viết lại (refactor) hàng ngàn dòng code cũ từ upstream, Hệ sinh thái Automa sử dụng chiến lược **Build-time Aliasing** (Ghi đè lúc biên dịch).

Gói `packages/webextension-polyfill` này tồn tại để:
1. **Đánh lừa trình biên dịch (Webpack/Vite):** Bất cứ khi nào code cũ `import browser from "webextension-polyfill"`, tiến trình build sẽ tự động trỏ (alias) về gói giả này.
2. **Cung cấp Wrapper An Toàn:** Gói này xuất (export) ra một đối tượng trung gian bọc trực tiếp các API `chrome.*` gốc (MV3 Native API), hoặc `browser.*` nếu chạy trên Firefox, thay vì dùng thư viện cồng kềnh của Mozilla.

## 🚀 Tác Dụng
- Kích thước bundle giảm đáng kể.
- Khắc phục 100% lỗi Crash trên Chrome mới.
- Không cần sửa đổi hàng loạt file mã nguồn cũ, đảm bảo việc Rebase/Sync từ upstream `AutomaApp/automa` vẫn an toàn tuyệt đối và không bị conflict mã nguồn.
