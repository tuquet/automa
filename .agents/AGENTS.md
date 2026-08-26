# Git Repository & Submodule Operations

- **Zero Git Push Mandate**: **TUYỆT ĐỐI KHÔNG** tự ý sử dụng lệnh `git push`. Chỉ USER mới được phép đẩy mã nguồn lên remote. Toàn bộ thay đổi phải được lưu trữ trong Local Git hoặc Staging Area.
- **Submodule Pointer Sync**: Trong Hybrid Monorepo, mỗi khi commit trong bất kỳ submodule nào (`automa-core`, `automa-webe`, `automa-vault`, `automa-vsce`), **BẮT BUỘC** chạy `pnpm run sync:submodules` để cập nhật con trỏ submodule tại Root trước khi commit ở Root.
- **Branching Strategy (`dev` vs `main`)**: Toàn bộ phát triển tính năng và vá lỗi **BẮT BUỘC** trên nhánh `dev`. Nhánh `main` chỉ dùng cho release sản xuất.
- **Decoupled Changesets**: `@changesets/cli` chạy độc lập bên trong từng submodule (chuyển vào thư mục submodule trước khi chạy `pnpm changeset`). Tuyệt đối không chạy changesets tại root.
- **File Organization (Scratch Files)**: Toàn bộ file nháp/test tạm thời **BẮT BUỘC** lưu trong thư mục `scratch/` tương ứng của submodule (ví dụ: `automa-vsce/scratch/`), không làm bẩn thư mục gốc.

# Monorepo Architecture & Reusability Rules

- **Canonical 4-Letter Submodule Codes**: `automa-webe` (Browser Extension), `automa-vsce` (VS Code Extension), `automa-desk` (Desktop Tauri), `automa-core` (Rust Daemon), `automa-vault` (Storage Workspace). Tên thư mục trong `skills/` phải khớp 100% với tên submodule.
- **Dual Reusable Build Targets từ `automa-webe`**:
  - `pnpm run build:runner` $\rightarrow$ Xuất Headless Execution Engine vào `dist/cli-runner`.
  - `pnpm run build:studio` $\rightarrow$ Xuất Standalone Web Canvas vào `dist/studio`.
  - **Reusability Mandate**: Các submodule khác (`automa-core`, `automa-vsce`, `automa-desk`) trực tiếp tiêu thụ 2 artifacts này, **TUYỆT ĐỐI KHÔNG** duplicate mã nguồn canvas/runner.
- **Dev Orchestration**: Dùng lệnh duy nhất `pnpm run dev:all` (`scripts/dev-orchestrator.mjs`) để khởi động toàn bộ môi trường phát triển (Rust Core + Studio + VS Code). Script tự động diệt tiến trình con khi tắt để ngăn rò rỉ port `8765`.
- **SSE vs WebSocket Protocols**:
  - **SSE (Server-Sent Events)**: Dùng cho dữ liệu 1 chiều (`/api/events`: Logs, Telemetry, Matrix progress).
  - **WebSocket (`/api/v1/ws`)**: Dùng cho điều khiển 2 chiều độ trễ thấp (`PAUSE_JOB`, `RESUME_JOB`, `KILL_JOB`, live breakpoints) tiêu thụ types từ `@automa/types/ws`.
- **Zero Fallback & Explicit Errors**: Toàn bộ endpoints dùng chuẩn `/api/v1/...` và trả về mã lỗi HTTP tường minh (`BadRequest`, `NotFound`, `Validation`, `InternalServerError`) với cấu trúc `ApiErrorResponse`. Tuyệt đối không dùng legacy fallback routing.

# Strict TypeScript, SOLID & Quality Standards

- **Zero Linter Bypass Invariant**: **TUYỆT ĐỐI KHÔNG** dùng `// biome-ignore` hay `// @ts-ignore` để lách luật. Mọi commit **BẮT BUỘC** đạt **0 errors, 0 warnings** trên lệnh lint (`pnpm run lint` / `biome check`).
- **Canonical Schema & Strict Typing**: Toàn bộ Command Handlers, IPC Message Payloads, Providers và Services **BẮT BUỘC** dùng trực tiếp kiểu dữ liệu từ `@automa/types` & `@automa/types/api`. Cấm tự sáng chế chữ ký lỏng lẻo (`Record<string, unknown>`, `as any`).
- **SOLID & Clean Code Principles**:
  - TDD Red-Green-Refactor (viết test mô tả hành vi trước khi viết production code).
  - Áp dụng 5 nguyên tắc SOLID, Object Calisthenics (tối đa 1 mức thụt lề, hàm < 10 dòng, class < 50 dòng, early returns, Demeter law).
  - Triệt tiêu Accidental Complexity bằng **YAGNI**, **KISS**, và **Rule of Three**.
- **Code Review & QA Swarm Protocols**:
  - Khi người dùng yêu cầu *Review / Refactor*: Dùng `invoke_subagent` spawn 5 Subagents chuyên biệt (SOLID, KISS/YAGNI, Demeter, Flow/Complexity, Safety) ở chế độ Read-only.
  - Khi người dùng yêu cầu *QC / Test*: Dùng `invoke_subagent` spawn 3 Subagents (Functional QA, Performance/Leak, Security) ở chế độ Read-only.
  - Agent chính là người duy nhất tổng hợp báo cáo và trực tiếp sửa code sau khi user chốt phương án.

# Backend API, OpenAPI & SDK Synchronization

- **Backend-First & Anti-Mocking Rule**: **TUYỆT ĐỐI CẤM** mock API ở Frontend hay hardcode trả lỗi `Not implemented yet`. Mọi API mới hoặc thiếu hụt **BẮT BUỘC** implement trực tiếp bằng Rust trong `automa-core` (Axum routes) trước.
- **Strict OpenAPI v3 Specification (`utoipa`)**:
  - `operation_id`: Bắt buộc dạng `snake_case` (e.g. `submit_job`, `get_job_history`) để `@hey-api/openapi-ts` sinh tên hàm TypeScript SDK chuẩn (`submitJob()`, `getJobHistory()`).
  - `tag`: Thuộc 1 trong 10 domain tags chuẩn (`Jobs`, `Storage`, `Browsers`, `Campaigns`, `System`, `History`, `Settings`, `Secrets`, `Lint`, `Events`).
  - DTO Structs: Toàn bộ struct/field phải có doc comment `///`, derive `ToSchema`, và cấm dùng `serde_json::Value` trần (phải có `#[schema(value_type = ...)]`).
- **Typed SDK Single Source of Truth**: Toàn bộ client (`automa-vsce`, webview, tests) **BẮT BUỘC** gọi qua Generated SDK (`@automa/types/api`). Cấm tự viết `fetch()` thô hoặc hardcode URL strings.
- **Sync Command**: Sau khi sửa API Backend, chạy `pnpm run sync:api` tại root để tự động cập nhật OpenAPI spec, SDK client, và Bruno collections.

# 4-Tier Testing Strategy

- **Tier 1: Submodule Unit Tests**:
  - `automa-vsce/src/test/`: Test Providers, Commands, Webview IPC qua Vitest (`pnpm test`). Mock đầy đủ `vscode.MarkdownString` và `vscode.ViewColumn` trong `setup.ts`.
  - `automa-core/src/`: Unit & integration tests của Rust core (`cargo test`).
- **Tier 2: Monorepo Cross-Service E2E Suite (`tests/e2e/`)**: Toàn bộ API E2E tests viết bằng TypeScript (Vitest) tại `tests/e2e/`, khởi chạy test daemon cô lập trên port `8766` và tiêu thụ Typed SDK. Tuyệt đối không viết API tests bằng Rust `#[tokio::test]`.
- **Tier 3: Strict Schema & Spec Linter**: `node scripts/enforce-strict-schema.mjs` kiểm tra 100% tính hợp lệ của OpenAPI spec.
- **Tier 4: Unified Test Command**: Chạy `pnpm run test` (`node scripts/test-all.mjs`) để tự động kiểm thử cả 4 tầng trước khi bàn giao.

# VS Code UI/UX & Webview Standards

- **3-Panel Sidebar Structure (GitHub Actions Standard)**:
  - Sidebar của `automa-vsce` **BẮT BUỘC** chỉ gồm đúng 3 Panel: `AUTOMATIONS` (`automa.workspace`), `BROWSERS` (`automa.browsers`), `STORAGE` (`automa.storage`).
  - **Gỡ bỏ hoàn toàn**: Panel `DASHBOARD` khỏi Activity Bar để tránh phân mảnh chiều cao.
  - **Xóa bỏ từ khóa Vault**: Dùng `Storage` thay cho `Vault` trên toàn bộ giao diện VS Code.
- **Flat List Namespace Tagging (Zero Nested Folders)**:
  - Trong `AutomaFilesProvider`, **TUYỆT ĐỐI KHÔNG** tạo cây thư mục lồng nhau sâu 4 cấp chevron rỗng (`automa-vault > google.com > fleets > file`).
  - **BẮT BUỘC** hiển thị danh sách phẳng trực quan kèm namespace badge `[parent/namespace]` (ví dụ: `[google.com/fleets] • v1.28.0 • 8 blocks`).
- **Concise Terms Invariant**: Nhãn súc tích: `Workflows (N)`, `Campaigns (N)`, `Packages (N)`, `Secrets`, `Variables`, `Tables`.
- **Visual Form Mode (Zero Raw JSON Burden)**: Các modal/view nhập liệu (như `TableView.vue`) **BẮT BUỘC** cung cấp giao diện Form trực quan với các input tự động nhận diện cột và builder `+ Add Column` động. Khung soạn thảo `JSON` chỉ là Tab phụ (Advanced Mode) cho power users.
- **Webview Testing & `data-testid`**: Mọi phần tử tương tác (inputs, selects, buttons, table rows/cells, modal tabs) **BẮT BUỘC** có thuộc tính `data-testid` rõ ràng để phục vụ kiểm thử tự động.
- **Webview Security & CSS Tokens**:
  - Cấm nội suy biến HTML trực tiếp; dùng `escapeHtml()` chống XSS, CSP với random nonce (32 chars).
  - Dùng đúng Semantic CSS tokens: Card border (`--vscode-panel-border`), Header divider (`--vscode-sideBarSectionHeader-border`), Table divider (`--vscode-panel-border, 0.12`). Cấm dùng `var(--vscode-widget-border)`.
- **Zero Dummy UI & Zero Silent Execution**: Toàn bộ nút bấm/hành động trên UI bắt buộc có handler 100%. Khi chạy workflow, tự động focus output channel và bridge luồng log qua IPC.

# Domain Terminology & Vault Cryptography

- **Domain Entity Hierarchy**: `Campaign` $\rightarrow$ `Browsers` $\rightarrow$ `Tasks` $\rightarrow$ `Workflows` $\rightarrow$ (Runtime) `Jobs`.
  - `Browser`: Thực thể trình duyệt ảo (`*.browser.json`). Tuyệt đối không dùng `Profile` hay `Member`.
  - `Campaign`: Chiến dịch chứa `browsers` và các `tasks` được lập lịch (`*.campaign.json`).
  - `Job`: Phiên thực thi động tại Runtime (`automa-core`).
- **Global Storage vs Storage Workspace**:
  - `Global Storage`: Cơ sở dữ liệu nghiệp vụ của Automa (`Tables`, `Variables`, `Credentials`) trong SQLite.
  - `Storage Workspace`: Cấu trúc thư mục chứa các tệp kịch bản trên đĩa (`automa-vault`).
- **Vault Zero-Leak Cryptography**:
  - `Variables` (`/api/v1/storage/variables`): Lưu cấu hình công khai không mã hóa (Plaintext).
  - `Credentials` (`/api/v1/storage/credentials`): Lưu mật khẩu/token được mã hóa chuẩn `HMAC-SHA256 (64 hex) + AES-256-CBC Base64 (Salted__)`.
  - Master Passphrase lưu trữ trong `vscode.SecretStorage` hoặc nạp qua `AUTOMA_PASSPHRASE`. Engine chỉ giải mã Secrets trong RAM khi thực thi cú pháp `{{secrets.key}}` và tự động giải phóng RAM, cấm ghi vào log.
