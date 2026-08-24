# Git Repository Rules

- **TUYỆT ĐỐI KHÔNG** tự ý sử dụng lệnh `git push` nếu không được yêu cầu.
- Đẩy mã nguồn lên remote là một hành động quan trọng và nhạy cảm. **CHỈ USER** mới được phép đẩy mã nguồn và sử dụng `git push`.
- Trừ khi được USER yêu cầu cụ thể, **PHẢI ĐỂ LẠI** toàn bộ các thay đổi đã hoàn thành trong Staging Area hoặc Working Directory để USER tự đánh giá và commit thủ công.

# Automa Ecosystem Validation & Data Flow

- **Permissive Studio / Strict Runner**: Các luồng công việc (workflows) từ cộng đồng xuất ra từ các phiên bản extension cũ thường có cấu trúc JSON lỏng lẻo (ví dụ: node IDs như `n1`, thiếu trường `type`, thiếu `version` ở root).
- **Auto-Sanitization on Load**: Bởi vì Automa Studio (VueFlow canvas) yêu cầu khắt khe các thuộc tính như nanoid hợp lệ để render chính xác, **TUYỆT ĐỐI KHÔNG** từ chối các file này bằng các lỗi nghiêm trọng. Thay vào đó, VS Code Extension hoặc logic import **BẮT BUỘC auto-inject** và làm sạch dữ liệu (ví dụ: thay thế `n1` bằng một nanoid, cập nhật edge handles tương ứng, đặt mặc định `type` là `BlockBasic`) *trước khi* tải lên Studio.
- **Linter UX**: CLI Linter (`automa lint`) **PHẢI XỬ LÝ** các sai lệch cấu trúc schema trong ngữ cảnh Editor dưới dạng `Warnings` thay vì `Errors` để duy trì trải nghiệm người dùng thoải mái và nhất quán. Kiểm tra tính hợp lệ khắt khe (strict validation) chỉ được dành riêng cho Runner.

# Automa Blocks JSON Recognition

- **Trigger**: Bất cứ khi nào người dùng gửi một đoạn mã JSON có `"name": "automa-blocks"` (chứa nodes, dimensions, và block data được xuất từ Automa Editor).
- **Behavior**: **BẮT BUỘC** nhận diện đây là một cấu hình Automa Node/Block.
- **Action**: **PHẢI DÙNG** ngay lập tức các kỹ năng về Automa ecosystem (ví dụ: `automa-cli`, `automa-ex-architecture`) để phân tích các tham số `type`, `label`, và `data` của node. **PHẢI CUNG CẤP** lời khuyên kỹ thuật, gỡ lỗi (debugging) hoặc mẹo tối ưu hóa chuyên biệt cho hệ sinh thái Automa.

# File Organization Rules
- **Scratch Files**: Bất kỳ tệp tạm thời, kiểm thử, dùng một lần hoặc script nháp nào được tạo ra trong phiên làm việc **BẮT BUỘC** được lưu bên trong thư mục \scratch/\ tương đối so với submodule/sub-project đang hoạt động (ví dụ: \automa-cli\scratch\ hoặc \automa-vault\scratch\). **TUYỆT ĐỐI KHÔNG** làm bẩn thư mục gốc của dự án bằng các tệp này.

# Automa Extension Architecture & Constraints

- **Repository**: `automa-ext` hiện là một nhánh (fork) độc lập tại `tuquet/automa-ext` (fork từ `AutomaApp/automa`). **ĐƯỢC PHÉP** chỉnh sửa trực tiếp.
  - **Upstream tracking**: `upstream` remote trỏ đến `AutomaApp/automa.git` để cherry-pick các bản vá lỗi (fixes) từ upstream khi cần thiết.
- **Daemon Architecture (VS Code / CLI)**:
  - **Primary Engine**: VS Code Extension (`automa-vscode`) **BẮT BUỘC** sử dụng Node Daemon cục bộ (`automa-cli serve`) thông qua REST/SSE APIs (ví dụ: `fetch`) cho TOÀN BỘ các tác vụ nặng về tài nguyên (`run`, `lint`, `install-browser`, `encrypt-secret`, history).
  - **NO Raw CLI**: **TUYỆT ĐỐI KHÔNG** sử dụng `child_process.exec` hoặc `spawn` để chạy các lệnh raw CLI (`automa-cli run ...`) như một phương án dự phòng bên trong VS Code trừ khi thật sự cần thiết (ví dụ: daemon bị sập). Lệnh raw CLI sinh ra (spawn) các V8 contexts mới, tiêu tốn quá nhiều RAM và dễ dẫn đến lỗi parse JSON từ stdout.
  - **NO Dynamic Imports in API Handlers**: Bên trong Daemon Server (`automa-cli/src/core/server`), **TUYỆT ĐỐI KHÔNG** sử dụng `await import(...)` bên trong các Route Handlers nóng. **PHẢI DÙNG** Static Imports ở đầu tệp để ngăn chặn độ trễ và phát hiện các module bị thiếu khi khởi động.
  - **DRY Async Handlers**: **BẮT BUỘC** bọc các Express Async Routes bằng một `asyncHandler` để tự động bắt và trả về lỗi 500. **TUYỆT ĐỐI KHÔNG** sao chép (duplicate) các khối `try/catch`.
  - **Zombie Process Prevention**: Khi viết các trình quản lý tiến trình con (như `BrowserManager`), **BẮT BUỘC** triển khai *Registry Pattern* (lưu trữ `instances` trong một `Set` tĩnh) và dọn dẹp sạch sẽ chúng bằng phương thức `destroyAll()` khi có tín hiệu tắt (graceful shutdown signals).
- **No `webextension-polyfill`**: Extension sử dụng các native `chrome.*` API (MV3) và `browser.*` API (Firefox) thông qua một wrapper tối giản tại `src/lib/browser-compat.js`.
  - **Build-time Aliasing Rule**: Để duy trì việc không có xung đột (zero conflicts) với kho lưu trữ `automa` thượng nguồn (upstream), **TUYỆT ĐỐI KHÔNG** thay thế thủ công lệnh `import browser from "webextension-polyfill"` trong các tệp mã nguồn. Thay vào đó, **PHẢI GIỮ NGUYÊN** mã nguồn upstream và **PHẢI DÙNG** Webpack `resolve.alias` (trong `webpack.config.js`) để chuyển hướng các import `webextension-polyfill` sang `src/lib/browser-compat.js` trong quá trình build.
  - **Daemon Polling & Reused Processes**: Khi kết nối tới một tiến trình Daemon đang chạy (sử dụng lại port), `DaemonManager` **BẮT BUỘC** theo dõi trạng thái một cách chính xác thông qua cờ `isExternalDaemon`. Phương thức `isRunning()` **BẮT BUỘC** trả về true cho các external daemons để ngăn vòng lặp polling của `TaskRunner` bị sập đột ngột với các lỗi ngắt kết nối giả.
  - **Chromium Version & Download Source**: CLI (`automa-cli`) **PHẢI DÙNG** bản build Chromium `latest` (`PuppeteerBrowser.CHROMIUM`), KHÔNG PHẢI Chrome for Testing. Chromium executable này được tải về từ Google Cloud Storage thông qua `@puppeteer/browsers`, trong khi Automa Extension (`automa-ex`) được tải về từ GitHub Releases.
- **MessageListener Routing Prefix**: Tiện ích `MessageListener` trong `automa-ext` tự động chặn các messages dựa trên tiền tố ngữ cảnh thực thi (ví dụ: `background--`, `offscreen--`).
  - **Rule**: Khi gọi các sự kiện extension từ các script bên ngoài sử dụng `chrome.runtime.sendMessage` trực tiếp, **BẮT BUỘC** nối thủ công (prepend) tiền tố chính xác (ví dụ: `background--workflow:execute` hoặc `offscreen--workflow:execute`). Nếu không, `MessageListener` sẽ không khớp (match) với tên sự kiện.
- **MV3 Offscreen Document Resilience**: Trong Chrome MV3, toàn bộ engine thực thi workflow (`WorkflowEngine`) chạy ngầm trong Offscreen Document (`offscreen.html`).
  - **Startup Race Prevention**: Khi trình duyệt vừa khởi động, `offscreen.bundle.js` mất vài trăm mili-giây để nạp và đăng ký `runtime.onMessage`. Bất kỳ lệnh gửi message nào tới Offscreen (như `BackgroundOffscreen.sendMessage`) **BẮT BUỘC** triển khai cơ chế *Retry with Backoff* (tối thiểu 5 lần, cách nhau 300ms) để xử lý lỗi `Could not establish connection. Receiving end does not exist`.
  - **Document State Check**: **PHẢI DÙNG** `chrome.offscreen.hasDocument()` kết hợp khối `try/catch` bọc quanh `chrome.offscreen.createDocument()` để không bị gián đoạn bởi lỗi `Only a single offscreen document may be created at any given time`.
- **NO Dynamic Imports in Extension Background Worker**: Bên trong `business/dev/index.js` và các entry point của Service Worker, **TUYỆT ĐỐI KHÔNG** dùng `await import(...)` cho các module cốt lõi (`BackgroundWorkflowUtils`, `WorkflowEngine`). **BẮT BUỘC DÙNG** Static Imports ở đầu tệp để tránh Webpack chia nhỏ chunk gây lỗi nạp module khi chạy headless.
- **Worker Daemon Idempotency & Singleton Guard**:
  - **Singleton Loop**: Bên trong `business/dev/index.js`, **BẮT BUỘC** sử dụng các cờ Singleton (`isWorkerDaemonInitialized`, `isOffscreenDaemonInitialized`) để đảm bảo trong suốt vòng đời trình duyệt chỉ duy nhất 1 kết nối SSE reader loop được khởi tạo.
  - **Webpack Entry Invariant**: Trong `webpack.runner.config.js`, **TUYỆT ĐỐI KHÔNG** chèn các script inject khởi tạo (như `inject-background.js`) vào `config.entry.background` nếu entry gốc (`src/background/index.js`) đã có sẵn lệnh import và gọi `automa('background')`. Làm như vậy sẽ gây duplicate execution (gọi 1 API chạy 2 tab/task).

# Knowledge Base & Documentation

- **Decentralized Docs (Microservices)**: Tài liệu dự án được phân tán về thư mục của từng microservice/submodule nhằm đảm bảo tính cập nhật (ví dụ: `automa-vscode/README.md`, `automa-core/README.md`). Thư mục `docs/` ở gốc chỉ đóng vai trò là một Hub chứa menu điều hướng phẳng.
- **Agent Initialization**: Khi được giao nhiệm vụ tìm hiểu kiến trúc hệ sinh thái, tính năng, hoặc các lệnh CLI/VSCode, **BẮT BUỘC** đọc `docs/Home.md` để lấy đường dẫn tới các file `README.md` của các submodule tương ứng.
- **Documentation Updates**: Bất cứ khi nào triển khai một tính năng lớn hoặc thay đổi kiến trúc, **BẮT BUỘC** cập nhật vào tệp `README.md` của submodule tương ứng (hoặc tạo thư mục `docs/` bên trong submodule nếu tài liệu quá dài).

# Monorepo Architecture & Reusability Rules

- **Prioritize Existing WIPs (Work-in-Progress)**: Trước khi sáng chế hoặc đề xuất các tích hợp kiến trúc phức tạp, polyfills, hoặc cầu nối liên gói (cross-package bridges) (ví dụ: nhúng ứng dụng Vue vào một VS Code Webview), **BẮT BUỘC** tìm kiếm triệt để trong monorepo các giải pháp WIP đã có.
  - **Action**: **LUÔN LUÔN** kiểm tra scripts trong `package.json`, các biến thể `webpack.*.config.js`, và workspaces `packages/` để xem liệu một mục tiêu build (build target) hoặc adapter (như `vscode-compat.js`) cụ thể đã được người dùng triển khai một phần hay chưa. **TUYỆT ĐỐI KHÔNG** xây dựng từ đầu nếu nền tảng đã tồn tại.
- **VSCE Packaging**: Trong cấu trúc Monorepo, nếu `npx vsce package` thất bại do xác thực phụ thuộc (dependency validation) khắt khe trong `package.json` (ví dụ: thiếu dependencies ở root), **ƯU TIÊN DÙNG** cờ `--no-dependencies` thay vì chỉnh sửa cấu trúc workspace và phá vỡ thiết kế monorepo gốc.

# Vue i18n & Webpack 5 Dynamic Imports Rule

- **JSON Dynamic Imports**: Khi tải động các tệp JSON (ví dụ: thông điệp locale cho vue-i18n) thông qua `await import(...)`, **BẮT BUỘC** xử lý an toàn việc giải quyết (resolution) export mặc định. Quá trình giải quyết JSON module của Webpack 5 có sự khác biệt giữa các bản build dev và production.
- **Implementation**: **PHẢI DÙNG** một hằng số dự phòng (fallback) `const content = messages.default || messages;` trước khi tiêm nó vào state (ví dụ: `i18n.global.mergeLocaleMessage(locale, content)`). **TUYỆT ĐỐI KHÔNG** chỉ dựa hoàn toàn vào `messages.default`.

# VS Code Webview Build & Asset Loading Workflow

- **Silent Runner Mode (CLI Target)**: Lệnh `pnpm run build` tiêu chuẩn sẽ xây dựng native browser extension chuẩn.
  - **Rule**: Bất cứ khi nào thực hiện các thay đổi dành cho CLI Daemon hoặc VS Code Extension, **BẮT BUỘC** chạy lệnh `pnpm run build:runner` để sử dụng cấu hình `webpack.runner.config.js`. Việc này tạo ra một bản headless build (không có UI) dành riêng cho CLI execution engine, xuất ra `dist/cli-runner`.
  - **Rule**: **TUYỆT ĐỐI KHÔNG** xuất (output) các UI bundles trực tiếp vào `automa-vscode` nữa. VS Code extension hiện tại chỉ đóng vai trò là một IPC client thuần túy.

# Versioning & Changelogs (Changesets)

- **Per-Submodule Versioning**: Hệ sinh thái sử dụng Kiến trúc Phân tách (Decoupled Architecture) cho việc đánh phiên bản (versioning). `@changesets/cli` được cài đặt ĐỘC LẬP bên trong mỗi submodule (`automa-cli`, `automa-ext`, `automa-vscode`).
- **Git Submodules Boundary**: Do mỗi package là một Git Submodule với lịch sử `.git` riêng, **TUYỆT ĐỐI KHÔNG** chạy changesets tại thư mục gốc của monorepo. Làm như vậy sẽ gây ra lỗi staging/cleanup.
- **Rule**: Bất cứ khi nào cần tạo một changeset hoặc chạy một phiên bản phát hành (`pnpm changeset version`), **BẮT BUỘC** thực hiện `cd` vào thư mục submodule cụ thể trước tiên. **TUYỆT ĐỐI KHÔNG** chạy nó tại thư mục root. **TUYỆT ĐỐI KHÔNG** viết lịch sử kiểu Changelog vào trong tệp `README.md`; **PHẢI DÙNG** changesets thay thế.
- **Native Debugger UI Reuse**: Ứng dụng Vue đã có sẵn một Debugger và Variables Inspector mạnh mẽ (`EditorDebugging.vue`). Khi làm việc với các tính năng Debugger cho VS Code, **TUYỆT ĐỐI KHÔNG** phát minh lại UI bên trong extension. Extension **BẮT BUỘC** chỉ thị cho Daemon khởi chạy Web Studio gốc để thực hiện debugging.

# Branching & Release Workflow (Dev vs Main)

- **The `dev` Branch (Integration)**: Toàn bộ quá trình phát triển tính năng, vá lỗi (bug fixes), và các lệnh `pnpm changeset` **BẮT BUỘC** nhắm mục tiêu vào nhánh `dev`. Nhánh `dev` tích lũy các tệp `.changeset/*.md`.
- **The `main` Branch (Production)**: Nhánh `main` **CHỈ ĐƯỢC DÙNG DÀNH RIÊNG** cho các bản phát hành sản xuất (production releases). **TUYỆT ĐỐI KHÔNG** commit hoặc push code trực tiếp lên nhánh `main`. Nhánh này chỉ chấp nhận merges từ `dev` hoặc các nhánh hotfix.
- **Release Execution Rule**: Khi được yêu cầu thực hiện phát hành (release), **BẮT BUỘC**:
  1. Chuyển sang nhánh `dev`.
  2. Chuyển (cd) vào (các) submodule mục tiêu và chạy `pnpm changeset version` để tiêu thụ các tệp `.md` và tăng phiên bản (bump versions).
  3. Commit các thay đổi vào nhánh `dev`.
  4. Merge `dev` vào `main` (hoặc chỉ dẫn USER thực hiện thông qua PR).
- **Hotfix Rule**: Hotfixes được phân nhánh (branch off) từ `main`, yêu cầu một changeset riêng, được tăng phiên bản (bumped), và **BẮT BUỘC** được merge ngược lại vào CẢ nhánh `main` và nhánh `dev`.

# CI/CD & Supply Chain Security Rules

- **Private Submodules Checkout**: Khi định cấu hình GitHub Actions (`actions/checkout`), nếu hệ sinh thái chứa các Git submodules ở chế độ riêng tư (private), **BẮT BUỘC** cung cấp một Personal Access Token một cách tường minh (`token: ${{ secrets.GH_PAT }}`) vì `GITHUB_TOKEN` mặc định không thể vượt qua ranh giới kho lưu trữ.
- **VS Code Extension `engines`**: Bất kỳ tệp `package.json` nào của VS Code extension **BẮT BUỘC** khai báo tường minh phiên bản VS Code hỗ trợ tối thiểu trong trường `engines.vscode` (ví dụ: `"engines": { "vscode": "^1.85.0" }`). Thiếu thông tin này, lệnh `vsce publish` sẽ thất bại vĩnh viễn.
- **VSCE CI Publishing**: **TUYỆT ĐỐI KHÔNG** sử dụng các actions của bên thứ ba đã lỗi thời (như `lannonbr/vsce-action`) để phát hành. **LUÔN LUÔN PHẢI DÙNG** lệnh CLI chính thức `npx @vscode/vsce publish -p ${{ secrets.VSCE_PAT }} --no-dependencies` trực tiếp (natively) bên trong bước `run`.
- **PNPM v9+ Built Dependencies (ERR_PNPM_IGNORED_BUILDS)**: Trong pnpm v9 trở lên (ví dụ: v11), trường `pnpm.onlyBuiltDependencies` trong `package.json` bị đánh dấu là lỗi thời và bị bỏ qua. Để ngăn chặn lỗi `ERR_PNPM_IGNORED_BUILDS` trong quá trình CI/CD, toàn bộ các packages yêu cầu scripts build sau khi cài đặt (ví dụ: `puppeteer`, `better-sqlite3`, `core-js`, `vue-demi`) **BẮT BUỘC** được phê duyệt tường minh dưới từ điển `allowBuilds` trong tệp gốc `pnpm-workspace.yaml`.

# Code Review & AI Refactoring Swarm

- **Trigger**: Bất cứ khi nào người dùng yêu cầu "review", "refactor", hoặc "improve code".
- **Behavior**: **TUYỆT ĐỐI KHÔNG** tự mình review một cách tuần tự và chậm chạp. ĐỒNG THỜI, để tránh xung đột mã nguồn (Race Conditions), các Agent cấp dưới KHÔNG ĐƯỢC PHÉP trực tiếp sửa code.
- **Action**: **BẮT BUỘC** sử dụng công cụ `invoke_subagent` để spawn (tạo ra) cùng lúc 5 AI Subagents (Mô hình: `pro`) chạy ngầm song song ở chế độ **Read-only**. Mỗi Subagent sẽ phụ trách thanh tra một khía cạnh riêng biệt của Clean Code:
  1. **SOLID & SoC Agent**: Quét tìm các God Objects, vi phạm Dependency Inversion và Separation of Concerns.
  2. **KISS & YAGNI Agent**: Tìm kiếm các thuật toán over-engineered, các file abstract thừa thãi cần rút gọn.
  3. **Demeter & Loose Coupling Agent**: Rà soát các chuỗi gọi hàm dài (train wrecks), Feature Envy.
  4. **Complexity & Flow Agent**: Tìm kiếm các khối Deep Nesting, Spaghetti Code và Cyclomatic Complexity cao.
  5. **Safety & Defensive Agent**: Báo cáo các lỗ hổng thiếu Fail Fast, Try/Catch, Sanitize Input, Null checks.
- **Reporting**: Agent chính **BẮT BUỘC** chờ cả 5 Subagents hoàn thành (thông qua `schedule` timer hoặc chờ tin nhắn), sau đó tổng hợp thành một báo cáo duy nhất (Executive Summary / Code Audit) cho USER. Agent chính sẽ là người DUY NHẤT trực tiếp sửa code sau khi USER chốt phương án.

# Quality Control (QC) & QA Swarm

- **Trigger**: Bất cứ khi nào người dùng yêu cầu "QC", "kiểm thử", "đảm bảo chất lượng", hoặc nhắc từ khóa "QC".
- **Behavior**: **TUYỆT ĐỐI KHÔNG** tự mình QC một cách phiến diện. ĐỒNG THỜI, các Agent cấp dưới KHÔNG ĐƯỢC PHÉP trực tiếp sửa code trong quá trình QC để tránh xung đột (Read-only mode).
- **Action**: **BẮT BUỘC** sử dụng công cụ `invoke_subagent` để spawn (tạo ra) cùng lúc 3 AI Subagents (Mô hình: `pro`) chạy ngầm song song. Mỗi Subagent sẽ phụ trách thanh tra một khía cạnh riêng biệt của Quality Control:
  1. **Functional QA & Edge Cases Agent**: Quét tìm các lỗi logic, điều kiện biên (boundary conditions), các trường hợp ngoại lệ chưa được xử lý (unhandled edge cases), và tính đúng đắn của tính năng.
  2. **Performance & Resource Leak QC Agent**: Soi xét các nút thắt hiệu năng (performance bottlenecks), các thao tác đồng bộ nặng nề gây block UI/Node, memory leaks, và zombie processes (tiến trình treo).
  3. **Security & Vulnerability QC Agent**: Rà soát các lỗ hổng bảo mật (XSS, Injection, CSP bypass), cách lưu trữ dữ liệu nhạy cảm (auth tokens/secrets) và kiểm soát truy cập phân quyền.
- **Reporting**: Agent chính **BẮT BUỘC** chờ cả 3 Subagents hoàn thành (thông qua `schedule` timer hoặc chờ tin nhắn), sau đó tổng hợp thành một báo cáo QC duy nhất (QC Audit Report) cho USER. Agent chính sẽ là người DUY NHẤT trực tiếp tiến hành vá lỗi (bug fix) sau khi USER chốt phương án.

# Automa Rust Core (automa-core) Architecture Rules

- **KISS & Pragmatic Architecture**: TUYỆT ĐỐI KHÔNG over-engineer bằng cách lạm dụng các Trait Interfaces (ví dụ: `JobRepository`, `BrowserRepository`) nếu dự án chỉ dùng một cơ sở dữ liệu duy nhất (SQLite). Hãy tuân thủ YAGNI bằng cách gọi trực tiếp các Concrete Structs (như `AutomaDb`, `SqliteJobRepository`) để loại bỏ boilerplate code. Chỉ sử dụng Trait/Dependency Inversion khi thực sự cần hoán đổi (swap) logic đa nền tảng hoặc mock test phức tạp.
- **Concurrency & Async Runtime**: **PHẢI DÙNG** `tokio` làm nền tảng xử lý bất đồng bộ. Đối với các tác vụ nặng về CPU (như mã hóa AES, parse JSON dung lượng khổng lồ), **BẮT BUỘC** chạy trên `tokio::task::spawn_blocking` để không block async runtime thread pool.
- **Robust Error Handling**: **TUYỆT ĐỐI KHÔNG** dùng `.unwrap()` hay `.expect()` trong code production để tránh crash daemon. **PHẢI DÙNG** thư viện `thiserror` để định nghĩa các kiểu lỗi (Error Types) cấp độ Domain và xử lý chúng gọn gàng bằng toán tử `?`.
- **State Management & Locks**: Khi lưu trữ State dùng chung (Shared State) trong Axum, **BẮT BUỘC** phải chia sẻ thông qua `Arc<T>`. Đối với dữ liệu cần thay đổi, **PHẢI DÙNG** `tokio::sync::RwLock` hoặc `tokio::sync::Mutex` (không dùng bản std::sync) để tránh lỗi Deadlocks trong môi trường bất đồng bộ.
- **Pre-Reporting Validation**:  Bất cứ khi nào Agent thực hiện chỉnh sửa mã nguồn bên trong `automa-core`, **BẮT BUỘC** phải chạy lệnh `cargo check` (hoặc đảm bảo `cargo watch` không báo lỗi) và xác nhận không có lỗi Borrow Checker hay Compile Errors trước khi báo cáo kết quả hoàn thành cho USER.
- **RESTful API Standards (Senior Level)**: Hệ thống BẮT BUỘC tuân thủ khắt khe thiết kế RESTful. **TUYỆT ĐỐI KHÔNG** nhúng các động từ hành động vào URL Path (ví dụ: dùng `POST /api/jobs` thay vì `POST /api/jobs/submit`, hay `DELETE /api/browsers/{id}/session` thay vì `POST /api/browsers/{id}/stop`). Khi phát hiện sự không đồng nhất, AI BẮT BUỘC phải sửa lại đường dẫn trong OpenAPI spec và Axum router cho chuẩn RESTful.


# API Sync & Docs Generation Rule

- **Trigger**: Bất cứ khi nào người dùng yêu cầu "sync api", "update bruno", "generate docs", hoặc đồng bộ tài liệu OpenAPI.
- **Behavior**: 
  1. **Pre-flight Check**: AI Agent **BẮT BUỘC** phải kiểm tra xem Rust Daemon (`automa-core`) có đang chạy ở cổng `8765` hay không (ví dụ: dùng lệnh `curl http://127.0.0.1:8765/api/health` hoặc kiểm tra process).
  2. **Daemon Wakeup**: Nếu Daemon chưa chạy, Agent **BẮT BUỘC** phải báo cho người dùng hoặc tự động khởi động nó ở chế độ background (sử dụng `cargo run --bin automa-core -- serve` tại thư mục `automa-core` và chờ vài giây).
  3. **Execution**: Sau khi chắc chắn Daemon đã sống, Agent **BẮT BUỘC** chuyển hướng ra thư mục gốc (root monorepo) và thực thi lệnh duy nhất: `pnpm run sync:api`. Lệnh này sẽ tự động lo liệu cả hai việc: import vào Bruno collection và sinh Markdown cho Obsidian.
  4. **Strict Schema Reminder**: Nếu người dùng nhờ viết thêm API, Agent **TUYỆT ĐỐI KHÔNG** được dùng `serde_json::Value` trực tiếp (mà không có `#[schema(value_type = ...)]`) để tránh làm vỡ linter khắt khe của hệ thống.


# API Endpoint Gap & Anti-Mocking Rule (Senior Mindset)

- **Trigger**: Bất cứ khi nào phát hiện sự thiếu hụt hàm API (Gap Endpoints), lỗi TypeScript khi gọi SDK, hoặc cần thêm tính năng giao tiếp giữa Frontend (`automa-vscode`) và Backend (`automa-core`).
- **Behavior (Tuyệt đối cấm)**: **TUYỆT ĐỐI KHÔNG** được "mock" (giả lập) API ở Frontend, không được hardcode trả về lỗi `Not implemented yet`, và cấm dùng `any` để bypass lỗi TypeScript compiler của Auto-generated SDK. Đây là tư duy của "Fresher".
- **Action (Quy trình chuẩn của Chuyên gia)**:
  1. **Backend First**: Bắt buộc phải implement endpoint bị thiếu trực tiếp bằng Rust bên trong `automa-core` (Axum routes).
  2. **Schema Export**: Khai báo OpenAPI Schema (`utoipa::path` và `ToSchema`). Đảm bảo tuân thủ `Strict Schema Reminder` (bổ sung `value_type` cho `serde_json::Value`).
  3. **Auto-Generate SDK**: Boot Daemon và chạy `pnpm run sync:api` tại thư mục gốc. Sau đó, chạy `pnpm run generate:api` bên trong `automa-vscode` nếu cần thiết để đè lại toàn bộ SDK Client.
  4. **Wrapper Integration**: Khôi phục các wrapper classes nếu chúng bị OpenAPI xóa nhầm (đặt chúng vào thư mục `wrappers/` thay vì `client/`) và trỏ các hàm gọi vào client vừa được tự động sinh ra.

# Unified Test Suite (E2E & Schema Validation)

- **Trigger**: Sau khi thực hiện các thay đổi lớn về tính năng, refactor, hoặc sửa lỗi (bug fixes) ảnh hưởng tới nhiều service.
- **Action**: Thay vì chạy test lẻ tẻ, **BẮT BUỘC** chuyển ra thư mục gốc (`root`) và chạy lệnh `node scripts/test-all.mjs`. Báo cáo kết quả của toàn bộ Unified Test Suite (Rust Cargo, Vitest E2E, Schema Linter) cho người dùng trước khi kết thúc công việc.

# VS Code Webview Security & UI Rendering (Automa UI)

- **Trigger**: Bất cứ khi nào tạo mới hoặc chỉnh sửa giao diện UI (Webview Providers) bên trong `automa-vscode`.
- **Behavior (Bắt buộc tuân thủ 3 lớp bảo mật)**:
  1. **Strict Sanitization**: **TUYỆT ĐỐI KHÔNG** nội suy biến trực tiếp vào chuỗi HTML (ví dụ: `${data.name}`). Toàn bộ dữ liệu động **BẮT BUỘC** phải được bọc qua hàm `escapeHtml(unsafe: string)` trước khi render để chống XSS.
  2. **Content-Security-Policy (CSP)**: Giao diện UI **BẮT BUỘC** phải có thẻ `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' var(--vscode-editor-background); script-src 'nonce-${nonce}';">` ở phần `<head>`.
  3. **Nonce Injection**: Phải tạo một chuỗi `nonce` ngẫu nhiên (32 ký tự alphanumeric) mỗi khi render, và nhúng vào CSP cũng như mọi thẻ `<script nonce="${nonce}">`. Tuyệt đối không dùng `unsafe-inline` cho script.

# API E2E Testing Strategy (Vitest over Cargo)

- **Trigger**: Bất cứ khi nào người dùng yêu cầu "viết test cho API", "test automa-core", hoặc bổ sung bài kiểm tra tích hợp (Integration Tests) cho hệ thống.
- **Behavior (Tuyệt đối cấm)**: **TUYỆT ĐỐI KHÔNG** viết các bài test API bằng Rust (e.g. `#[tokio::test]`) bên trong thư mục `automa-core/tests`. Tư duy này không mô phỏng được hành vi gọi API từ một external client.
- **Action (Quy trình chuẩn)**:
  1. **Vitest Blackbox**: Toàn bộ API E2E Tests **BẮT BUỘC** phải được viết bằng TypeScript (Vitest) và đặt tại thư mục gốc `tests/e2e/`.
  2. **Daemon Spawning**: Bài test phải sử dụng `child_process.spawn('cargo', ['run', '--bin', 'automa-core', '--', 'serve', ...])` trong `beforeAll` để khởi động Rust Daemon trên một port động (hoặc port test), và kill process này trong `afterAll`.
  3. **Fetch API**: Sử dụng `fetch` API tiêu chuẩn của Node.js để kiểm thử các RESTful endpoints như một client độc lập.

# Frontend-Backend State Sync Rule (Event-Driven vs Polling)

- **Trigger**: Bất cứ khi nào cần theo dõi trạng thái, tiến trình chạy (jobs), hoặc đồng bộ dữ liệu theo thời gian thực giữa Frontend (`automa-vscode`) và Backend (`automa-core`).
- **Behavior (Tuyệt đối cấm)**: **TUYỆT ĐỐI KHÔNG** sử dụng vòng lặp Polling (ví dụ: `while(!done) await sleep(500)`) hoặc gửi HTTP request dư thừa định kỳ (như `getJobStatus()`) ở Frontend. Tư duy này làm chết CPU và nghẽn Network (Anti-pattern).
- **Action (Quy trình Hướng Sự Kiện)**:
  1. **SSE First**: Frontend **BẮT BUỘC** phải lắng nghe Server-Sent Events (SSE) qua `GlobalSseListener.ts` (kết nối tới `/api/events` hoặc endpoint tương đương) để nhận trạng thái mới nhất từ Rust Daemon.
  2. **Promise Resolution**: Bọc các tác vụ cần chờ đợi vào một `Promise` và chỉ resolve khi nhận được sự kiện SSE tương ứng (ví dụ: `workflow_finished`).
  3. **Rust Channel Capacity**: Đảm bảo Backend (Rust `tokio::sync::broadcast`) có đủ capacity (ví dụ: `10000`) để không gây hoảng loạn (panic) lỗi `Lagged` khi có chớp nhoáng quá nhiều sự kiện.
  4. **Leak Prevention**: Luôn dọn dẹp các SSE Listeners (e.g., `stopGlobalSseListener()`) khi ngắt kết nối để tránh Event/Socket Leaks.

# Automa Unified Business Domain & Terminology Rule

- **Hierarchy & Entity Relationship**:
  - `Campaign` -> `Browsers` -> `Tasks` -> `Workflows` -> (Runtime) `Jobs`
- **Standard Domain Vocabulary (Tuyệt đối tuân thủ)**:
  1. **`Browser`**: Thực thể trình duyệt ảo độc lập (Anti-Detect Browser). **TUYỆT ĐỐI KHÔNG** dùng các từ rác/lỗi thời như `Profile`, `Browser Profile`, `Browser Browser`, hay `Member`. File: `*.browser.json`, Table: `browsers`, Router: `/api/browsers`.
  2. **`Campaign`**: Tập hợp các Browsers và Lịch trình tự động hóa. File: `*.campaign.json` (fallback `*.campaigns.json`). Trong Campaign, danh sách thực thi là `browsers` (chứa các `tasks` được giao cho browser đó).
  3. **`Task`**: Tác vụ được lập lịch trên Browser trong Campaign (`schedule`: `on-start`, `cron`, `delay`, `once`) chỉ định `workflow_id`.
  4. **`Workflow`**: Kịch bản luồng Automa (`*.workflow.json`).
  5. **`Job`**: Phiên thực thi động tại Runtime (`automa-core`), quản lý qua `/api/jobs` và SSE `/api/events`.

# VS Code Webview Semantic CSS Tokens & UX Rules

- **Border & Divider Semantic Tokens**:
  - **TUYỆT ĐỐI KHÔNG** sử dụng `var(--vscode-widget-border)` cho các đường viền nội bộ (Card borders, list row dividers, section header borders). `widget.border` là token dành riêng cho Floating Overlay Widgets (như Ctrl+F Find Widget, IntelliSense popup) và sẽ hiển thị màu trắng gắt/chói mắt trên panel.
  - **BẮT BUỘC DÙNG** các Semantic Tokens chuẩn sau:
    - **Card / Container Border**: `var(--vscode-panel-border, rgba(128, 128, 128, 0.18))` hoặc `var(--vscode-editorGroup-border)`.
    - **Section Header Divider**: `var(--vscode-sideBarSectionHeader-border, var(--vscode-panel-border, rgba(128, 128, 128, 0.18)))`.
    - **List Row / Table Divider**: `var(--vscode-panel-border, rgba(128, 128, 128, 0.12))` hoặc `.vscode-divider`.
- **Webview Accessibility (a11y) Invariant**:
  - Bất kỳ phần tử tương tác nào không phải thẻ `<button>` hoặc `<a>` (ví dụ: `<span @click="...">`) **BẮT BUỘC** khai báo đầy đủ: `role="button"`, `tabindex="0"`, và lắng nghe sự kiện phím (`@keydown.enter.prevent`, `@keydown.space.prevent`).
- **Actionable Empty States Invariant**:
  - Toàn bộ các TreeItem và Webview Empty States **BẮT BUỘC** nêu rõ 2 vế: (1) Trạng thái hiện tại và (2) Hướng dẫn hành động tiếp theo (ví dụ: `(Right click or run Automa: Add Variable to create)`).
