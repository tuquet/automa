# automa-vscode

## 0.1.1

### Patch Changes

- - **Architectural Shift (Silent Runner):** Chuyển đổi trọng tâm biên dịch từ `webpack.vscode.config.js` sang `webpack.runner.config.js`. Loại bỏ giao diện UI (`newtab`, `sandbox`) khỏi extension gốc để tối ưu hóa dung lượng phục vụ riêng cho CLI Daemon.
  - **Decoupled VS Code UI:** Không còn đóng gói (bundle) trực tiếp UI vào `automa-vscode`. Toàn bộ giao tiếp giữa VS Code và lõi Automa được thực hiện qua IPC của CLI Daemon.
  - **Dependency Cleanup:** Xóa bỏ các gói thư viện không sử dụng (`mitt`, `puppeteer-core`, `leader-line-new`, `sortablejs`...) và một số devDependencies dư thừa nhằm giảm thiểu kích thước node_modules.
  - **Documentation Overhaul:** Cập nhật lại toàn bộ tài liệu `README.md` theo định dạng Đặc tả Kỹ thuật (Technical Specification), loại bỏ các đoạn hành văn mang tính lịch sử (Changelog-style).
