---
name: agent-qa-answers
description: Bảng đáp án chuẩn (Ground Truth) chuyên sâu cho 42 câu hỏi khảo thí kiến trúc Automa Ecosystem. Dùng để tra cứu và train các AI Agent khác (Bản có Code References).
---

# Đáp Án Chuẩn Chuyên Sâu (Technical Deep-Dive) - Automa Ecosystem QA

Tài liệu này cung cấp đáp án chính xác tuyệt đối cho bộ 42 câu hỏi trong `documents/QA_Agent_Interrogation.md`. Tất cả đáp án đều được đối chiếu trực tiếp với mã nguồn của `automa-ext`, `automa-cli`, và `automa-vscode`.

## Phần 1: Kiến trúc Lõi & Luồng Dữ Liệu
**Đáp án 1:** Không cần khai báo cứng. Dựa theo kiến trúc **Domain-Driven Directory Structure**, mã nguồn `VaultScannerService` kết hợp với `WorkflowRepository` trong CLI sử dụng cơ chế quét đệ quy (Decentralized Scanning). Tuy nhiên, có luật khắt khe về **Hậu tố (Suffix)**:
- Hàm `findWorkflowRecursive()` chấp nhận mọi file `*.json` hoặc `*.automa.json`.
- Tuy nhiên, hàm nạp tổng thể `loadAll()` (được dùng bởi Daemon để xây dựng trạng thái Vault) **bắt buộc** file phải tuân thủ hậu tố: `*.workflow.json`, `*.package.json`, `*.variables.json`, v.v. 
Do đó, bạn có thể đặt file ở `crm/marketing/wf.workflow.json` và hệ thống sẽ tự động quét đệ quy tìm thấy, không cần nhét cứng vào thư mục root `workflows/`.

**Đáp án 2:** Chạy được trực tiếp. File `automa-cli/src/core/services/WorkflowLoaderService.ts` chứa logic `transformGitHubUrl()`. Nó dùng regex để thay thế `github.com` thành `raw.githubusercontent.com`, bỏ qua thư mục `blob`, và sau đó dùng `ofetch` HTTP GET thẳng nội dung JSON thuần túy vào RAM để chạy, bỏ qua bước `git clone`.

**Đáp án 3:** VueFlow yêu cầu `nanoid`. Tuy nhiên, để tuân thủ luật **Auto-Sanitization**, khi nạp một file JSON có ID lỗi (`n1, n2`), class `WorkflowSanitizer` sẽ âm thầm duyệt qua toàn bộ mảng `drawflow.nodes`, tạo bảng tra cứu (mapping map) từ `n1 -> [nanoid mới]`, sau đó cập nhật lại toàn bộ ngõ `source` và `target` trong mảng `drawflow.edges` để đồng bộ. File vẫn sẽ mở thành công mà không văng lỗi.

**Đáp án 4:** `VaultContextResolver` là class thông minh giúp suy ngược đường dẫn root của dự án. Khi gõ lệnh ở `cwd = /crm/workflows`, hàm `findUp()` của Resolver sẽ liên tục nhảy lùi về thư mục cha (`..`) cho đến khi tìm thấy file dấu hiệu `automa.vault.json`. Khi đó nó set biến `vaultPath` để làm gốc tham chiếu cho toàn bộ Daemon.

---

## Phần 2: Cơ Chế Live Sync & Dashboard Mode
**Đáp án 5:** Khi mở Studio mà không có file, hệ thống sẽ rơi vào "Dashboard Mode". Dữ liệu thao tác của người dùng trên UI (Vue.js) được Background script lưu vào `chrome.storage.local` (IndexedDB). Từ bên ngoài, `SyncWatcher.ts` của CLI sẽ phát hiện có bản ghi mới và tự động chạy hàm `fs.writeFileSync` để thả một file `.json` xuống `process.cwd()`.

**Đáp án 6:** Giao tiếp qua biến Global Window và DOM Events. File `BrowserManager.ts` của CLI khi gọi Puppeteer đã sử dụng lệnh `page.evaluateOnNewDocument` để nhúng hàm `__syncVaultItemToLocal` vào Window của trình duyệt ảo. Mỗi khi Background script (trong `automa-ext`) phát hiện thay đổi (`onChanged.addListener`), nó sẽ gọi ngược hàm này để bắn tín hiệu ra ngoài Node context.

---

## Phần 3: VS Code Extension & Daemon API
**Đáp án 7:** **Không tuân thủ.** File `automa-vscode/src/core/TaskRunner.ts` có 2 hàm: `submitJob` (dùng HTTP POST tới Daemon - chuẩn quy tắc) và `runAutomaCli` (dùng `vscode.ProcessExecution(cmd, args)` - vi phạm quy tắc). Lệnh `automa studio` hiện tại đang gọi `runAutomaCli(["studio"])` vì khi kiểm tra thư mục `automa-cli/src/core/server/`, Daemon không hề phơi bày endpoint `/api/studio`.

**Đáp án 8:** Sẽ sập vì Memory Leak và JSON Parse Error. Theo `AGENTS.md`, mỗi lệnh `child_process.exec('automa-cli run')` sẽ kéo lên một V8 Javascript Context hoàn toàn mới (cực nặng). Thêm vào đó, nếu có console.log() chạy lung tung, dữ liệu trả về qua `stdout` sẽ bị nhiễm rác, làm vỡ hàm `JSON.parse()`.

**Đáp án 9:** Tái sử dụng UI. Extension tận dụng nguyên bản file Vue Component `EditorDebugging.vue` của ứng dụng web. File `StudioWebviewPanel.ts` đóng vai trò là cầu nối: nó chặn các Webview message từ UI (như `workflow:resume`) và bắn HTTP Request tới API của Daemon.

**Đáp án 10:** Lệnh `build` sẽ thất bại nếu dùng trong VS Code. Bạn bắt buộc phải chạy `pnpm run build:vscode` trong `automa-ext/` để sử dụng cấu hình `webpack.vscode.config.js`. Điểm sống còn là phải có dòng `__webpack_public_path__ = window.ASSETS_BASE_URL;` ở đầu file Entry để V8 Engine biết đường tải các file Chunk JS qua giao thức cục bộ `vscode-resource:` thay vì giao thức `http://`.

---

## Phần 7: Tư duy Tự động hóa & AI Workflow Generation (Phân tích Code chuyên sâu)

**Đáp án 31 (Looping):** Dựa theo mã nguồn `automa-ext/src/workflowEngine/blocksHandler/handlerLoopData.js` (dòng 19-22):
```javascript
refData.loopData[data.loopId] = {
  data: currentLoopData,
  $index: index,
};
```
- Các block phía sau **BẮT BUỘC** phải gọi biến bằng cú pháp ngầm định: `{{loopData.<loopId>.data}}`. 
- **Edge Case:** Ở Block xử lý cuối cùng của chu trình, AI phải sinh ra một object trong mảng `edges` trỏ ngược `target` về ID của block `loop-data`. Nếu đứt dây này, `index` không được tăng và workflow kết thúc sớm.

**Đáp án 32 (Conditionals):** Theo mã nguồn `handlerConditions.js` (dòng 84):
```javascript
outputId = data.conditions[conditionsResult.index].id;
```
Block `conditions` định nghĩa mảng `data.conditions = [{ id: 'cond1', type: 'value', ... }]`. Dây cáp (edge) đi ra từ nhánh Match 1 phải khai báo `sourceHandle: 'cond1'` (Trùng với ID của condition). Dây cáp đi ra từ nhánh False/Error phải dùng `sourceHandle: 'fallback'`.

**Đáp án 33 (Variable Interpolation in JS):** **Cấm** dùng Mustache `{{}}` trong JS Block!
Đọc source code `handlerJavascriptCode.js` (dòng 114), hàm tiêm context của Automa đã định nghĩa cứng một hàm helper:
```javascript
function automaRefData(keyword, path = '') { ... }
```
AI **bắt buộc** phải sinh code dạng: `const mail = automaRefData('variables', 'my_email');` để lấy biến. Nếu chèn `{{variables.my_email}}`, V8 Engine sẽ ném lỗi Syntax Error vì dấu `{` bị xem là khối code.

**Đáp án 34 (Error Handling / Fallback):** Khi AI tạo một block `click-element`, trong thuộc tính `data`, AI phải thiết lập cờ `onError: 'fallback'`. Sau đó, sinh ra một object `edge` có `source: <click_node_id>` và `sourceHandle: 'fallback'`, nối `target` tới ID của một block `telegram` hoặc `log`.

**Đáp án 35 (Iframes):** Chromium không thể đâm xuyên qua Document Boundaries của thẻ Iframe. AI **Bắt buộc** phải sinh một block `switch-frame` (loại `switch-to-iframe`) trước khối `forms`, truyền tham số `data.selector` trỏ tới thẻ `<iframe>`. Khi tương tác xong, phải gọi lại `switch-frame` (loại `main-frame`) để thoát ra.

**Đáp án 38 (JavaScript Return):** Khi code Async, lệnh `return` cổ điển bị vô hiệu hóa trong luồng của Engine. Đọc `handleJavascriptBlock.js` sẽ thấy Automa bọc code trong một Promise. AI **bắt buộc** phải sinh hàm nội bộ `automaNextBlock(data)` để Resolve Promise đó và chuyển chuỗi dữ liệu (payload) sang block tiếp theo.

**Đáp án 39 (Data Extraction - Trick Question):** Đây là bẫy! Hệ sinh thái Automa **KHÔNG TỒN TẠI** block `extract-data` hay thuộc tính `dataToExtract`. Để xuất Array/Table thay vì đè biến đơn lẻ, AI phải dùng block `get-text` (hoặc `attribute-value`), sau đó cấu hình cờ `multiple: true` và `saveData: true, dataColumn: "Ten_SP"`.

**Đáp án 40 (Modularization):** Để vượt rào Token Limit, AI thiết kế kiến trúc Micro-Workflows: sinh ra nhiều file `.workflow.json` nhỏ, mỗi file có ID Nanoid. Sau đó sinh một file Main Workflow chỉ chứa các block `execute-workflow` (chỉ định `executeId` bằng ID các file con). `WorkflowLinter` sẽ tự động quét đệ quy Vault để Cross-Reference nối chúng lại.

**Đáp án 41 (Auth/Cookies Bypass):** Thay vì viết chuỗi block vượt Captcha dễ sập, ưu tiên sử dụng `Browser Profiles`. Login tay 1 lần, lưu profile. Khi gọi qua CLI, dùng `--profile <ID>`. Trình duyệt sẽ nạp thư mục `User Data Dir` chứa Cookies cũ, bypass hoàn toàn màn hình Login.

**Đáp án 42 (Headless Detection):** Theo `BrowserLauncher.ts`, Automa sử dụng cờ `--headless=new` (thay vì `--headless` cũ) truyền vào hàm `execFile`. Phiên bản Headless mới này giả lập đầy đủ pipeline render đồ họa, giúp fingerprint giống hệt trình duyệt thật, vượt qua phần lớn rào cản Cloudflare chống bot.

---

## Tổng kết những góc nhìn tâm đắc nhất (Agent Learnings)
Qua 42 câu truy vấn, một AI Agent cần nắm giữ các "Bí kíp" cốt lõi sau để không phá hỏng hệ thống:
1. **Auto-Sanitization là chiếc phao cứu sinh:** Hệ thống sẽ không văng lỗi khi file JSON sai ID, mà `WorkflowSanitizer` sẽ dùng Regex bắt các ID hỏng (như `node_1`), sinh ra `nanoid` chuẩn, ánh xạ lại toàn bộ `edges` và lưu đè.
2. **Khởi tạo và triệt tiêu Process thông minh:** `ProcessManager` bắt mọi tín hiệu OS (SIGINT/SIGTERM) để Kill Tree tránh tràn RAM. Tuyệt đối không dùng `puppeteer.launch()`, Automa dùng `execFile` kèm cờ `--remote-debugging-port`, sau đó fetch `/json/version` bắt WebSocket URL và `puppeteer.connect()`.
3. **Đàm phán cổng (Port Negotiation):** Daemon không bao giờ crash nếu cổng mặc định (8765) bị trùng. `DaemonManager` sẽ quét tịnh tiến port và spawn lệnh với `--port` mới.
4. **Webpack 5 Extension Vitals:** Khi build UI/Extension có Webpack 5, để dynamic imports (`await import()`) của Locales không bị lỗi đường dẫn khi nhúng vào ảo hóa, bắt buộc phải override `__webpack_public_path__ = window.ASSETS_BASE_URL` hoặc `chrome.runtime.getURL('/')`.
5. **Validation Mềm & Cứng (Linter):** Chạy thật ngoài CLI, `BaseLinter` bật cờ `isStrict = true` -> Gây Crash execution. Khi mở trên VS Code Editor, `isStrict = false` -> Biến đổi Diagnostic báo lượn sóng màu vàng thân thiện tại chính xác số dòng (tìm bằng Regex `indexOf`).
