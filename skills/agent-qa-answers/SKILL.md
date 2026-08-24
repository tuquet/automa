---
name: agent-qa-answers
description: Bảng đáp án chuẩn (Ground Truth) chuyên sâu cho 42 câu hỏi khảo thí kiến trúc Automa Ecosystem. Dùng để tra cứu và train các AI Agent khác (Bản có Code References).
---

# Đáp Án Chuẩn Chuyên Sâu (Technical Deep-Dive) - Automa Ecosystem QA

TÀI LIỆU NÀY **BẮT BUỘC CUNG CẤP** đáp án chính xác tuyệt đối cho bộ 42 câu hỏi trong `documents/QA_Agent_Interrogation.md`. **PHẢI ĐỐI CHIẾU** trực tiếp tất cả đáp án với mã nguồn của `automa-ext`, `automa-cli`, và `automa-vscode`.

## Phần 1: Kiến trúc Lõi & Luồng Dữ Liệu
**Đáp án 1:** **TUYỆT ĐỐI KHÔNG** khai báo cứng. **PHẢI DỰA THEO** kiến trúc **Domain-Driven Directory Structure**, mã nguồn `VaultScannerService` kết hợp với `WorkflowRepository` trong CLI **PHẢI SỬ DỤNG** cơ chế quét đệ quy (Decentralized Scanning). **BẮT BUỘC TUÂN THỦ** luật khắt khe về **Hậu tố (Suffix)**:
- Hàm `findWorkflowRecursive()` **BẮT BUỘC CHẤP NHẬN** mọi file `*.json` hoặc `*.automa.json`.
- Hàm nạp tổng thể `loadAll()` (được dùng bởi Daemon để xây dựng trạng thái Vault) **BẮT BUỘC** file phải tuân thủ hậu tố: `*.workflow.json`, `*.package.json`, `*.variables.json`, v.v. 
**PHẢI ĐẶT** file ở `crm/marketing/wf.workflow.json` để hệ thống tự động quét đệ quy tìm thấy, **TUYỆT ĐỐI KHÔNG** nhét cứng vào thư mục root `workflows/`.

**Đáp án 2:** **BẮT BUỘC CHẠY ĐƯỢC** trực tiếp. File `automa-cli/src/core/services/WorkflowLoaderService.ts` **PHẢI CHỨA** logic `transformGitHubUrl()`. **PHẢI DÙNG** regex để thay thế `github.com` thành `raw.githubusercontent.com`, **BẮT BUỘC BỎ QUA** thư mục `blob`, và **PHẢI DÙNG** `ofetch` HTTP GET thẳng nội dung JSON thuần túy vào RAM để chạy, **BẮT BUỘC BỎ QUA** bước `git clone`.

**Đáp án 3:** VueFlow **BẮT BUỘC YÊU CẦU** `nanoid`. TUY NHIÊN, để **TUÂN THỦ TỐI ĐA** luật **Auto-Sanitization**, khi nạp một file JSON có ID lỗi (`n1, n2`), class `WorkflowSanitizer` **BẮT BUỘC** âm thầm duyệt qua toàn bộ mảng `drawflow.nodes`, **PHẢI TẠO** bảng tra cứu (mapping map) từ `n1 -> [nanoid mới]`, sau đó **PHẢI CẬP NHẬT** lại toàn bộ ngõ `source` và `target` trong mảng `drawflow.edges` để đồng bộ. File **BẮT BUỘC SẼ** mở thành công mà không văng lỗi.

**Đáp án 4:** `VaultContextResolver` **BẮT BUỘC SUY NGƯỢC** đường dẫn root của dự án. Khi gõ lệnh ở `cwd = /crm/workflows`, hàm `findUp()` của Resolver **BẮT BUỘC** liên tục nhảy lùi về thư mục cha (`..`) cho đến khi tìm thấy file dấu hiệu `automa.vault.json`. Khi đó **PHẢI THIẾT LẬP** biến `vaultPath` để làm gốc tham chiếu cho toàn bộ Daemon.

---

## Phần 2: Cơ Chế Live Sync & Dashboard Mode
**Đáp án 5:** Khi mở Studio mà không có file, hệ thống **BẮT BUỘC RƠI VÀO** "Dashboard Mode". Dữ liệu thao tác của người dùng trên UI (Vue.js) **PHẢI LƯU VÀO** `chrome.storage.local` (IndexedDB) qua Background script. Từ bên ngoài, `SyncWatcher.ts` của CLI **BẮT BUỘC PHÁT HIỆN** có bản ghi mới và **PHẢI TỰ ĐỘNG CHẠY** hàm `fs.writeFileSync` để thả một file `.json` xuống `process.cwd()`.

**Đáp án 6:** **PHẢI GIAO TIẾP** qua biến Global Window và DOM Events. File `BrowserManager.ts` của CLI khi gọi Puppeteer **PHẢI DÙNG** lệnh `page.evaluateOnNewDocument` để nhúng hàm `__syncVaultItemToLocal` vào Window của trình duyệt ảo. Mỗi khi Background script (trong `automa-ext`) phát hiện thay đổi (`onChanged.addListener`), **BẮT BUỘC GỌI NGƯỢC** hàm này để bắn tín hiệu ra ngoài Node context.

---

## Phần 3: VS Code Extension & Daemon API
**Đáp án 7:** **TUYỆT ĐỐI KHÔNG SỬ DỤNG** `child_process` hay `vscode.ProcessExecution`. Kiến trúc hiện tại **BẮT BUỘC LÀ** **Thin Client & Daemon**. File `automa-vscode/src/core/TaskRunner.ts` **BẮT BUỘC CHỈ SỬ DỤNG** giao tiếp HTTP POST hoặc WebSocket tới Daemon. Lệnh `automa studio` **BẮT BUỘC PHẢI GỌI** trực tiếp endpoint API của Daemon, **TUYỆT ĐỐI KHÔNG** khởi chạy tiến trình con nội bộ.

**Đáp án 8:** **CHẮC CHẮN SẼ SẬP** vì Memory Leak và JSON Parse Error nếu vẫn dùng lệnh `child_process.exec('automa-cli run')`. Theo kiến trúc chuẩn, **BẮT BUỘC PHẢI DÙNG** API gọi trực tiếp đến Daemon để thực thi luồng. Daemon **BẮT BUỘC ĐẢM NHẬN** toàn bộ trọng trách chạy lệnh và trả kết quả qua mạng. **TUYỆT ĐỐI TRÁNH** khởi tạo V8 Javascript Context mới thông qua tiến trình con gây lãng phí tài nguyên và rác `stdout`.

**Đáp án 9:** **BẮT BUỘC TÁI SỬ DỤNG** UI. Extension **PHẢI TẬN DỤNG** nguyên bản file Vue Component `EditorDebugging.vue` của ứng dụng web. File `WorkflowPreviewEditorProvider.ts` **BẮT BUỘC ĐÓNG VAI TRÒ** là cầu nối: **PHẢI CHẶN** các Webview message từ UI (như `workflow:resume`) và **PHẢI BẮN** HTTP Request tới API của Daemon.

**Đáp án 10:** **TUYỆT ĐỐI KHÔNG SỬ DỤNG** Webpack cho UI của VS Code. Kiến trúc Thin Client hiện đại **BẮT BUỘC SỬ DỤNG** công cụ đóng gói chuẩn (như Vite) và nạp assets trực tiếp. Các tệp tĩnh **PHẢI ĐƯỢC PHÂN PHỐI** qua giao thức `vscode-webview-resource:` thông qua cơ chế chuẩn của VS Code, **TUYỆT ĐỐI CẤM** dùng biến toàn cục `__webpack_public_path__` hay cấu trúc cũ lỗi thời.

---

## Phần 7: Tư duy Tự động hóa & AI Workflow Generation (Phân tích Code chuyên sâu)

**Đáp án 31 (Looping):** **BẮT BUỘC DỰA THEO** mã nguồn `automa-ext/src/workflowEngine/blocksHandler/handlerLoopData.js` (dòng 19-22):
```javascript
refData.loopData[data.loopId] = {
  data: currentLoopData,
  $index: index,
};
```
- Các block phía sau **BẮT BUỘC** gọi biến bằng cú pháp ngầm định: `{{loopData.<loopId>.data}}`. 
- **Edge Case:** Ở Block xử lý cuối cùng của chu trình, AI **BẮT BUỘC SINH RA** một object trong mảng `edges` trỏ ngược `target` về ID của block `loop-data`. NẾU đứt dây này, `index` **TUYỆT ĐỐI KHÔNG ĐƯỢC TĂNG** và workflow kết thúc sớm.

**Đáp án 32 (Conditionals):** **PHẢI DỰA THEO** mã nguồn `handlerConditions.js` (dòng 84):
```javascript
outputId = data.conditions[conditionsResult.index].id;
```
Block `conditions` **BẮT BUỘC ĐỊNH NGHĨA** mảng `data.conditions = [{ id: 'cond1', type: 'value', ... }]`. Dây cáp (edge) đi ra từ nhánh Match 1 **PHẢI KHAI BÁO** `sourceHandle: 'cond1'` (Trùng với ID của condition). Dây cáp đi ra từ nhánh False/Error **PHẢI DÙNG** `sourceHandle: 'fallback'`.

**Đáp án 33 (Variable Interpolation in JS):** **TUYỆT ĐỐI CẤM** DÙNG Mustache `{{}}` trong JS Block!
**PHẢI THEO** source code `handlerJavascriptCode.js` (dòng 114), hàm tiêm context của Automa **BẮT BUỘC ĐỊNH NGHĨA** cứng một hàm helper:
```javascript
function automaRefData(keyword, path = '') { ... }
```
AI **BẮT BUỘC SINH CODE** dạng: `const mail = automaRefData('variables', 'my_email');` để lấy biến. NẾU CHÈN `{{variables.my_email}}`, V8 Engine **CHẮC CHẮN SẼ** ném lỗi Syntax Error vì dấu `{` bị xem là khối code.

**Đáp án 34 (Error Handling / Fallback):** Khi AI tạo một block `click-element`, trong thuộc tính `data`, AI **PHẢI THIẾT LẬP** cờ `onError: 'fallback'`. SAU ĐÓ, **BẮT BUỘC SINH RA** một object `edge` có `source: <click_node_id>` và `sourceHandle: 'fallback'`, **PHẢI NỐI** `target` tới ID của một block `telegram` hoặc `log`.

**Đáp án 35 (Iframes):** Chromium **TUYỆT ĐỐI KHÔNG THỂ** đâm xuyên qua Document Boundaries của thẻ Iframe. AI **BẮT BUỘC SINH** một block `switch-frame` (loại `switch-to-iframe`) trước khối `forms`, **PHẢI TRUYỀN** tham số `data.selector` trỏ tới thẻ `<iframe>`. KHI tương tác xong, **BẮT BUỘC PHẢI GỌI LẠI** `switch-frame` (loại `main-frame`) để thoát ra.

**Đáp án 38 (JavaScript Return):** Khi code Async, lệnh `return` cổ điển **BẮT BUỘC BỊ VÔ HIỆU HÓA** trong luồng của Engine. **PHẢI BỌC** code trong một Promise THEO `handleJavascriptBlock.js`. AI **BẮT BUỘC SINH** hàm nội bộ `automaNextBlock(data)` để Resolve Promise đó và **PHẢI CHUYỂN** chuỗi dữ liệu (payload) sang block tiếp theo.

**Đáp án 39 (Data Extraction - Trick Question):** ĐÂY LÀ BẪY! Hệ sinh thái Automa **TUYỆT ĐỐI KHÔNG TỒN TẠI** block `extract-data` hay thuộc tính `dataToExtract`. Để xuất Array/Table thay vì đè biến đơn lẻ, AI **PHẢI DÙNG** block `get-text` (hoặc `attribute-value`), SAU ĐÓ **BẮT BUỘC CẤU HÌNH** cờ `multiple: true` và `saveData: true, dataColumn: "Ten_SP"`.

**Đáp án 40 (Modularization):** Để vượt rào Token Limit, AI **PHẢI THIẾT KẾ** kiến trúc Micro-Workflows: **BẮT BUỘC SINH RA** nhiều file `.workflow.json` nhỏ, mỗi file có ID Nanoid. SAU ĐÓ **PHẢI SINH** một file Main Workflow chỉ chứa các block `execute-workflow` (chỉ định `executeId` bằng ID các file con). `WorkflowLinter` **SẼ TỰ ĐỘNG** quét đệ quy Vault để Cross-Reference nối chúng lại.

**Đáp án 41 (Auth/Cookies Bypass):** THAY VÌ viết chuỗi block vượt Captcha dễ sập, **BẮT BUỘC ƯU TIÊN SỬ DỤNG** `Browsers`. **PHẢI LOGIN** tay 1 lần, **BẮT BUỘC LƯU** browser. KHI GỌI qua CLI, **PHẢI DÙNG** `--browser <ID>`. Trình duyệt **CHẮC CHẮN SẼ NẠP** thư mục `User Data Dir` chứa Cookies cũ, **BẮT BUỘC BYPASS** hoàn toàn màn hình Login.

**Đáp án 42 (Headless Detection):** THEO `BrowserLauncher.ts`, Automa **BẮT BUỘC SỬ DỤNG** cờ `--headless=new` (thay vì `--headless` cũ) truyền vào hàm `execFile`. Phiên bản Headless mới này **BẮT BUỘC GIẢ LẬP** đầy đủ pipeline render đồ họa, **ĐẢM BẢO GIÚP** fingerprint giống hệt trình duyệt thật, **BẮT BUỘC VƯỢT QUA** phần lớn rào cản Cloudflare chống bot.

---

## Tổng kết những góc nhìn tâm đắc nhất (Agent Learnings)
Qua 42 câu truy vấn, một AI Agent **BẮT BUỘC NẮM GIỮ** các "Bí kíp" cốt lõi sau để không phá hỏng hệ thống:
1. **Auto-Sanitization là chiếc phao cứu sinh:** Hệ thống **CHẮC CHẮN SẼ KHÔNG** văng lỗi khi file JSON sai ID, mà `WorkflowSanitizer` **BẮT BUỘC SẼ** dùng Regex bắt các ID hỏng (như `node_1`), **PHẢI SINH RA** `nanoid` chuẩn, **BẮT BUỘC ÁNH XẠ** lại toàn bộ `edges` và **PHẢI LƯU ĐÈ**.
2. **Khởi tạo và triệt tiêu Process thông minh:** `ProcessManager` **BẮT BUỘC BẮT** mọi tín hiệu OS (SIGINT/SIGTERM) để Kill Tree tránh tràn RAM. **TUYỆT ĐỐI KHÔNG DÙNG** `puppeteer.launch()`, Automa **PHẢI DÙNG** `execFile` kèm cờ `--remote-debugging-port`, SAU ĐÓ **PHẢI FETCH** `/json/version` bắt WebSocket URL và `puppeteer.connect()`.
3. **Đàm phán cổng (Port Negotiation):** Daemon **TUYỆT ĐỐI KHÔNG BAO GIỜ** crash nếu cổng mặc định (8765) bị trùng. `DaemonManager` **BẮT BUỘC QUÉT** tịnh tiến port và **PHẢI SPAWN** lệnh với `--port` mới.
4. **Bundler & Module Loaders Hiện Đại:** Khi build UI/Extension, **TUYỆT ĐỐI KHÔNG SỬ DỤNG** Webpack lỗi thời hay biến toàn cục `__webpack_public_path__`. **BẮT BUỘC SỬ DỤNG** các bundler hiện đại (như Vite/ESBuild) kết hợp với đường dẫn tương đối hoặc cơ chế asset mapping chuẩn của nền tảng (VS Code Webview hoặc Chrome Extension) để nạp tệp tĩnh và dynamic imports mà không phá vỡ liên kết ảo hóa.
5. **Validation Mềm & Cứng (Linter):** CHẠY THẬT ngoài CLI, `BaseLinter` **BẮT BUỘC BẬT** cờ `isStrict = true` -> Gây Crash execution. KHI MỞ trên VS Code Editor, `isStrict = false` -> **BẮT BUỘC BIẾN ĐỔI** Diagnostic báo lượn sóng màu vàng thân thiện tại chính xác số dòng (tìm bằng Regex `indexOf`).
