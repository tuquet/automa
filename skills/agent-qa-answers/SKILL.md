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
