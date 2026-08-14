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
  - **Rule**: Khi gọi các sự kiện extension từ các script bên ngoài sử dụng `chrome.runtime.sendMessage` trực tiếp, **BẮT BUỘC** nối thủ công (prepend) tiền tố chính xác (ví dụ: `background--workflow:execute`). Nếu không, `MessageListener` sẽ không khớp (match) với tên sự kiện.

# Knowledge Base & Documentation

- **Primary Source of Truth**: Toàn bộ tài liệu dự án được tập trung tại một Obsidian Vault nằm ở thư mục `documents/`.
- **Agent Initialization**: Khi được giao nhiệm vụ tìm hiểu kiến trúc hệ sinh thái, tính năng, hoặc các lệnh CLI/VSCode, **LUÔN LUÔN BẮT BUỘC** đọc `documents/Home.md` và `documents/_meta/All_Documents.base` trước tiên.
- **Documentation Updates**: Bất cứ khi nào triển khai một tính năng lớn hoặc thay đổi kiến trúc, **BẮT BUỘC** cập nhật các tệp Markdown tương ứng trong `documents/` Vault.
- **Mandatory Skills**: Khi làm việc với Vault, **BẮT BUỘC** nạp và áp dụng các kỹ năng cục bộ (local skills) sau:
  1. `obsidian-markdown`: Để định dạng ghi chú, sử dụng wikilinks, callouts, và frontmatter.
  2. `obsidian-bases`: Để tạo hoặc cập nhật tệp `.base` nhằm truy vấn và tóm tắt dữ liệu vault một cách động.

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
