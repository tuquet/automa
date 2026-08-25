# 🌐 Ma Trận Kiểm Thử Hệ Sinh Thái Automa (Ecosystem Test Matrix)

Chào mừng bạn đến với trung tâm giám sát chất lượng và ma trận kiểm thử tổng thể của **Automa Ecosystem**. Hệ thống áp dụng chiến lược kiểm thử đa tầng (Multi-tier Testing Strategy) đảm bảo tính toàn vẹn từ lõi Rust Engine tới giao diện VS Code Extension và Chrome Web Extension.

---

## 🧭 1. Kim Tự Tháp Kiểm Thử Hệ Sinh Thái (Ecosystem Testing Pyramid)

```mermaid
graph TD
    subgraph E2E["🔗 Tầng 3: Tích Hợp Đa Dịch Vụ (Multi-Service E2E)"]
        RootE2E["tests/e2e (Rust Backend + Browser Sessions + SQLite Storage + SSE Streams)"]
        WVE2E["Playwright Headless Webview E2E (5 Vue Webview Apps)"]
    end

    subgraph Unit_Integration["💻 Tầng 2: Kiểm Thử Submodules (Unit & Component Level)"]
        VSCode["automa-vscode (107 tests / 23 suites - Vitest)"]
        ExtBuild["automa-ext (Webpack Standalone Studio & Silent Runner Targets)"]
    end

    subgraph Core_Engine["🦀 Tầng 1: Lõi Thực Thi Cấp Thấp (Rust Backend Engine)"]
        Core["automa-core (21 cargo tests - Crypto, AST Sanitizer, OpenAPI, DB)"]
    end

    E2E --> Unit_Integration
    Unit_Integration --> Core_Engine

    style E2E fill:#2a4365,stroke:#4299e1,color:#fff
    style Unit_Integration fill:#2c5282,stroke:#63b3ed,color:#fff
    style Core_Engine fill:#1a365d,stroke:#3182ce,color:#fff
```

---

## 📊 2. Bảng Tổng Hợp Chỉ Số Kiểm Thử Từng Phân Hệ

| Phân Hệ (Submodule) | Công Nghệ Kiểm Thử | Số Tests / Suites | Trạng Thái | Tài Liệu Chi Tiết | Lệnh Thực Thi |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **`automa-vscode`** | Vitest v4 + Playwright | **107 tests / 23 suites** | ✅ **Passed** | [📄 automa-vscode Test Matrix](file:///c:/Users/pn.tund2/Documents/Repository/automa-ecosystem/automa-vscode/docs/TEST_MATRIX.md) | `pnpm -F vscode-automa test` |
| **`automa-core`** | Cargo Test (Rust) | **21 tests** | ✅ **Passed** | [📄 automa-core README](file:///c:/Users/pn.tund2/Documents/Repository/automa-ecosystem/automa-core/README.md) | `cargo test --manifest-path automa-core/Cargo.toml` |
| **`automa-ext`** | Webpack 5 + ESLint | **Build & Lint Pipeline** | ✅ **Passed** | [📄 automa-ext README](file:///c:/Users/pn.tund2/Documents/Repository/automa-ecosystem/automa-ext/README.md) | `pnpm -F automa build:studio` |
| **`automa-types`** | TypeScript Compiler (`tsc`) | **Wire Contract & SDK** | ✅ **Passed** | [📄 automa-types README](file:///c:/Users/pn.tund2/Documents/Repository/automa-ecosystem/packages/automa-types/README.md) | `pnpm -F @automa/types build` |
| **Root E2E Suite** | Vitest E2E + Live Daemon | **4 Kịch bản Tích hợp** | ✅ **Passed** | [📄 tests/e2e Directory](file:///c:/Users/pn.tund2/Documents/Repository/automa-ecosystem/tests/e2e) | `pnpm test` / `node scripts/test-all.mjs` |

---

## 🛠️ 3. Sổ Tay Chạy Kiểm Thử Toàn Diện (All-in-One Testing SOP)

### 1. Kiểm tra toàn bộ hệ sinh thái (All Packages)
```bash
# Chạy script điều phối kiểm thử tất cả các gói
pnpm test
# hoặc
node scripts/test-all.mjs
```

### 2. Kiểm thử riêng lẻ từng phân hệ
- **VS Code Extension (107 tests)**:
  ```bash
  pnpm -F vscode-automa test
  ```
- **Rust Daemon Core (21 tests)**:
  ```bash
  cargo test --manifest-path automa-core/Cargo.toml
  ```
- **Kiểm tra tự động sinh mã OpenAPI SDK (Zero-conflict)**:
  ```bash
  pnpm run sync:api
  ```
- **Đóng gói toàn bộ Monorepo**:
  ```bash
  pnpm run build
  ```

---

## 🔗 4. Liên Kết Điều Hướng

- [🏠 Documentation Hub](file:///c:/Users/pn.tund2/Documents/Repository/automa-ecosystem/docs/Home.md)
- [💻 Chi Tiết Ma Trận Kiểm Thử automa-vscode (107 tests)](file:///c:/Users/pn.tund2/Documents/Repository/automa-ecosystem/automa-vscode/docs/TEST_MATRIX.md)
- [📚 Danh Mục Hướng Dẫn Kỹ Thuật automa-vscode](file:///c:/Users/pn.tund2/Documents/Repository/automa-ecosystem/automa-vscode/docs/README.md)
