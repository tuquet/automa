---
title: Agent Interrogation Q&A
date: 2026-08-11
tags:
  - testing
  - architecture
  - prompts
  - agents
---

# Bộ Câu Hỏi "Sát Hạch" AI Agents (Automa Ecosystem)

*Tài liệu này chứa các câu hỏi hóc búa để kiểm tra độ am hiểu kiến trúc, luồng dữ liệu, và các quy tắc ngầm (được quy định trong `AGENTS.md`) đối với bất kỳ Agent nào tham gia phát triển hệ sinh thái Automa. Tuyệt đối không cung cấp đáp án trong file này để giữ tính khách quan.*

---

## Phần 1: Kiến trúc Lõi & Luồng Dữ Liệu
**Câu 1:** Cấu trúc thư mục của Automa Vault hoạt động theo nguyên tắc nào? Có cần phải khai báo cứng thư mục `workflows/` và `Campaigns/` ở root của vault không? Tại sao?

**Câu 2:** Khi người dùng cung cấp một link URL trỏ tới một file JSON trên GitHub (dạng `https://github.com/tuquet/automa-vault/blob/main/wf.json`), công cụ `automa-cli` của chúng ta có chạy trực tiếp được đường link này không hay phải dùng `git clone` tải file về trước? Giải thích cơ chế đằng sau.

**Câu 3:** Khi khởi tạo một workflow bằng AI và xuất ra định dạng JSON, tại sao ID của các Node/Block nhất thiết phải là chuẩn `nanoid` mà không dùng chuỗi đơn giản như `n1, n2, n3`? Nếu file JSON cũ lỡ dùng `n1, n2`, thì hệ thống xử lý (Auto-Sanitization) như thế nào để không làm sập giao diện kéo thả?

**Câu 4:** Bạn hãy giải thích vai trò của class `VaultContextResolver` trong hệ thống CLI. Tại sao lại cần nó khi người dùng có thể gõ lệnh thực thi CLI từ bất kỳ thư mục con nào trong ổ cứng máy tính?

---

## Phần 2: Cơ Chế Live Sync & Dashboard Mode
**Câu 5:** Khi người dùng gõ lệnh `automa studio` để mở trình duyệt thiết kế UI bằng Puppeteer. Nếu họ tạo một Workflow hoàn toàn mới trên giao diện (chưa từng có file trên ổ cứng), thì dữ liệu đó được lưu ở đâu trong trình duyệt? Và làm cách nào CLI biết đường để trích xuất và lưu (Live Sync) thành file `.json` xuống thư mục hiện tại (`pwd`)?

**Câu 6:** Làm sao để hệ thống CLI `automa-cli` giao tiếp được với giao diện Vue của `automa-ext` khi nó đang chạy ngầm trong Puppeteer? Nó dùng WebSockets, HTTP Polling hay cơ chế lắng nghe sự kiện IndexedDB nào? 

---

## Phần 3: VS Code Extension & Daemon API
**Câu 7:** Theo thiết kế trong `AGENTS.md`, trong Automa VS Code Extension, toàn bộ các lệnh như `run`, `lint`, `studio` đều bắt buộc phải tuân thủ chặt chẽ việc gọi qua REST API của HTTP Daemon. Bạn hãy kiểm tra lại mã nguồn hiện tại xem quy tắc này có đang được tuân thủ 100% không? Có ngoại lệ nào đang phải dùng Raw CLI Process không?

**Câu 8:** Nếu tôi viết script Node.js dùng `child_process.exec('automa-cli run ...')` để nhúng vào Backend thay vì dùng VS Code Extension hoặc Daemon API, hệ thống có chạy được không? Tại sao tài liệu kiến trúc lại tuyệt đối khuyên không dùng cách này?

**Câu 9:** Giao diện Debugger (chạy từng bước, đặt breakpoint) hiển thị trên VS Code Webview có phải được code lại hoàn toàn bằng React/VSCode UI không? Nếu không, nó tận dụng lại UI từ đâu và làm sao để giao tiếp (Message Bridging) với extension?

**Câu 10:** Tôi vừa code xong một tính năng giao diện (UI) mới toanh cho VS Code Webview nằm trong thư mục `automa-ext/src/newtab/`. Tôi chỉ cần đứng ở thư mục gốc gõ lệnh `pnpm run build` là VS Code sẽ nhận giao diện mới này đúng không? Tại sao?

---

## Phần 4: Ràng Buộc Extension & Webpack
**Câu 11:** Bản Build Runner (`build:runner`) của Automa Extension khác gì với bản build gốc thông thường? Khi dùng CLI để chạy workflow bằng bản Runner này, cờ (flag) truyền vào như thế nào và làm sao để truyền các biến môi trường (Global Variables)?

**Câu 12:** Tôi đang muốn fix một bug liên quan đến việc không nhận diện được hàm `chrome.tabs.sendMessage` trong source code của `automa-ext`. Tôi có thể giải quyết bằng cách sửa trực tiếp import thành `import browser from "webextension-polyfill"` trong mã nguồn không? Nếu không thì phải làm sao?

**Câu 13:** Khi sử dụng `automa-cli` để mở Dashboard bằng trình duyệt ảo Puppeteer, mã nguồn Webpack của extension lại load các chunk ngôn ngữ (Vue i18n locale) bị lỗi. Bạn sẽ xử lý lỗi import JSON động (dynamic import) này trong môi trường Webpack 5 như thế nào cho an toàn?

**Câu 14:** Tôi cần gửi tín hiệu từ một Dummy Tab bên ngoài vào cho Background Worker của Extension để yêu cầu thực thi workflow. Tại sao tôi dùng `chrome.runtime.sendMessage({ name: 'workflow:execute' })` mà Extension cứ im ru không phản hồi? Tôi đã thiếu quy tắc Routing Prefix nào?

---

## Phần 5: Linter, Quản Lý Tiến Trình & File Rác
**Câu 15:** Lệnh `automa lint` có phân biệt giữa việc kiểm tra file chạy thực tế trong CLI (Strict Runner) và file đang được thiết kế/mở trong VS Code (Permissive Studio) không? UX của Linter xử lý các lỗi cấu trúc lược đồ như thế nào?

**Câu 16:** Mỗi lần chạy `automa run`, CLI sẽ spawn ra một phiên bản Browser Chromium mới. Lỡ workflow bị crash giữa chừng hoặc user bấm huỷ (Ctrl+C), hệ thống làm thế nào để đảm bảo không bị kẹt các "Zombie Process" lấp đầy RAM của máy tính? 

**Câu 17:** Làm sao để đóng gói (package) một thư viện Workflow thành một Sub-workflow và gọi nó từ một Workflow khác? Khi dùng Linter kiểm tra, Linter làm sao biết được cái Sub-workflow đó có thực sự tồn tại trong ổ cứng hay không (Cross-Reference Validation)?

**Câu 18:** Trong cấu hình Automa Vault, một Campaign Profile (file `.profile.json`) quy định các tham số gì? Nếu tôi gõ `automa lint` một file Workflow có tham chiếu đến Profile ID đó nhưng tôi quên tải file Profile về máy, Linter sẽ hiển thị thông báo gì?

**Câu 19:** Khi bạn (hoặc các AI Agent khác) làm việc và cần viết các đoạn script nháp (scratch scripts) hoặc file dữ liệu test dùng 1 lần. Theo quy tắc trong tổ chức file, bạn được phép vứt các file đó ở đâu để không làm bẩn thư mục mã nguồn gốc?

**Câu 20:** Lệnh `automa run` gọi Chromium bằng cách sử dụng `puppeteer.launch()` đúng không? Nếu sai thì nó dùng hàm gốc nào của Node.js kết hợp với CDP (Chrome DevTools Protocol) để khởi tạo trình duyệt? (Gợi ý: Kiểm tra SKILL Browser Launcher).

---

## Phần 6: VS Code Webview, Parameter Extraction & Auto-Sanitization
**Câu 21:** Làm sao để biết được một file JSON trong Vault là một Reusable Package hay là một Workflow thông thường? VS Code Webview (`WorkflowPreviewEditorProvider`) sử dụng tiêu chí cụ thể nào để nhận diện và render giao diện tương ứng?

**Câu 22:** Khi người dùng click mở một file workflow bị sai cấu trúc nghiêm trọng (ví dụ: ID của node bị thiết lập là 'n1' thay vì nanoid hợp lệ) trong VS Code thông qua Workflow Preview, hệ thống sẽ báo lỗi màu đỏ chót và từ chối mở file đúng không? Nếu không, hệ thống đã ngầm làm phép thuật gì với `vscode.WorkspaceEdit`?

**Câu 23:** Trong VS Code Extension, tính năng Linter Diagnostics làm cách nào để hiển thị gạch chân lượn sóng (Squiggly Lines) chính xác đúng dòng bị lỗi, trong khi công cụ kiểm tra JSON Schema (Ajv của Linter Engine) không hề trả về số dòng (line number) cụ thể?

**Câu 24:** Theo tài liệu kỹ thuật, làm sao hệ thống Workflow Preview có thể tự động trích xuất các tham số đầu vào (Parameters) mà người dùng không khai báo rõ ràng nhưng lại dùng ngầm trong các biểu thức của workflow để tạo thành Form nhập liệu lúc chạy? (Gợi ý: Cụm từ `{{variables.xyz}}`).

**Câu 25:** Khi Daemon của VS Code Extension được bật khởi động ngầm (`automa-cli serve`), nếu cổng mặc định (8765) đã bị chiếm dụng bởi một tiến trình lạ hoặc một cửa sổ VS Code khác, hệ thống sẽ lập tức crash hay sẽ xử lý đàm phán cổng như thế nào? (Gợi ý: Quá trình kiểm tra `/api/health`).

**Câu 26:** Dựa vào kỹ năng (Skills) của bạn, khi một AI Agent muốn lấy content của một trang web trực tuyến mà không muốn bị lẫn lộn các thẻ HTML điều hướng lộn xộn (để tiết kiệm Token AI), Agent sẽ sử dụng công cụ/skill gì thay vì WebFetch mặc định?

---

## Phần 7: Tư duy tự động hóa & AI Workflow Generation
**Câu 27:** Khi một người dùng giao cho bạn một nhiệm vụ (Goal) chung chung như "Viết cho tôi workflow tải báo cáo doanh thu mỗi sáng", bạn sẽ thực hiện quy trình phân tích và "phân rã" (break down) bài toán như thế nào trước khi bắt tay vào viết file JSON cho Automa?

**Câu 28:** Trong quá trình sinh mã JSON, làm thế nào để bạn (với tư cách là một AI Agent) chọn đúng loại Block (Ví dụ: khi nào dùng `active-tab`, `forms`, `extract-data`, `javascript-code`) và đảm bảo các tham số bên trong `data` của mỗi Block hoàn toàn khớp với schema của Automa?

**Câu 29:** Mạng lưới luồng đi của Workflow được quyết định bởi mảng `edges`. Là một AI không có giao diện đồ họa, làm thế nào bạn tính toán logic và kết nối chính xác được node nguồn (`source`), node đích (`target`) và đặc biệt là các ngõ kết nối (Ví dụ: `sourceHandle`, `targetHandle`, cổng fallback, cổng success)?

**Câu 30:** Nếu bạn (AI) liên tục sinh ra các ID không đạt chuẩn Nanoid (ví dụ `node_1`, `node_2`) vì giới hạn bối cảnh, và đẩy file JSON đó cho người dùng. Dựa trên bộ luật của `AGENTS.md`, hệ thống sẽ ném thẳng lỗi vào mặt người dùng hay sẽ có cơ chế "bao dung" nào để "cứu vớt" file JSON của bạn?

**Câu 31: (Edge Case - Looping)** Khi thiết kế một vòng lặp bằng block `loop-data`, làm thế nào bạn đảm bảo các block phía sau vòng lặp lấy đúng dữ liệu của "vòng lặp hiện tại"? Nếu bạn quên nối dây quay ngược lại block `loop-data` ở cuối chu trình, chuyện gì sẽ xảy ra?

**Câu 32: (Edge Case - Conditionals)** Block `conditions` cho phép rẽ nhánh luồng đi dựa trên logic. Dữ liệu cấu trúc mảng bên trong block này phải viết thế nào? Làm sao bạn chỉ định được một dây nối (edge) đi ra từ ngõ "Match 1" so với ngõ "Fallback"? (Gợi ý: Thuộc tính `sourceHandle`).

**Câu 33: (Edge Case - Variable Interpolation)** Nếu bạn muốn lấy giá trị của một biến có tên `my_email` để điền vào block `forms`, bạn sẽ dùng cú pháp `{{variables.my_email}}`. Tuy nhiên, nếu bạn đang viết code trong block `javascript-code`, bạn có được dùng cú pháp Mustache đó không hay phải dùng một hàm Automa API chuyên dụng nào khác?

**Câu 34: (Edge Case - Error Handling)** Khi block `click-element` cố click vào một nút không tồn tại trên web, mặc định workflow sẽ bị sập (crash). Là một AI, làm sao bạn cấu hình file JSON để workflow không sập mà rẽ nhánh sang một block cảnh báo lỗi qua Telegram? (Gợi ý: Cổng Fallback / On Error).

**Câu 35: (Edge Case - Iframes)** Nhiệm vụ là điền form thanh toán, nhưng form đó nằm trong một thẻ `<iframe>` của Stripe. Nếu bạn chỉ sinh block `forms` trỏ tới selector của thẻ input, nó có chạy được không? Bạn cần phải dùng block gì trước đó?

**Câu 36: (Edge Case - Dynamic Selectors)** Nếu trang web mục tiêu sử dụng React/Tailwind với các class bị hash liên tục (ví dụ: `class="btn-primary-xYz12"`). Thay vì cố định selector bằng class, bạn (với tư cách AI) sẽ ưu tiên dùng chiến thuật selector nào (ví dụ: XPath, thuộc tính data-*, hay text) để đảm bảo workflow chạy ổn định về lâu dài?

**Câu 37: (Edge Case - Synchronization)** Để workflow cạo dữ liệu chạy ổn định, việc chờ trang web tải xong là bắt buộc. Tại sao một AI thông minh nên ưu tiên cấu hình block `wait-for-element` thay vì lạm dụng block `delay` cứng 5 giây?

**Câu 38: (Edge Case - JavaScript Return)** Trong block `javascript-code`, nếu bạn cần chạy một tác vụ bất đồng bộ (chờ API trả về) và muốn truyền kết quả đó sang block tiếp theo. Bạn sẽ dùng lệnh `return data;` thông thường, hay phải dùng hàm `automaNextBlock(data)` / Promise của Automa?

**Câu 39: (Edge Case - Data Extraction)** Khi cấu hình block `extract-data` để cạo một danh sách gồm "Tên sản phẩm" và "Giá", làm sao bạn cấu trúc thuộc tính `dataToExtract` trong JSON để Automa biết xuất ra một Table/Array chuẩn thay vì đè lên một biến đơn lẻ?

**Câu 40: (Edge Case - Modularization)** Nếu bạn được yêu cầu sinh ra một workflow quá lớn (gồm 100 block), vượt quá giới hạn Token context của bạn. Bạn sẽ áp dụng chiến thuật chia nhỏ (Modularization) sử dụng block `execute-workflow` như thế nào để sinh ra nhiều file JSON nhỏ thay vì một file khổng lồ?

**Câu 41: (Edge Case - Auth/Cookies)** Người dùng yêu cầu tạo workflow đăng nhập Facebook. Thay vì thiết kế một chuỗi các block điền user/password và vượt CAPTCHA (rất dễ xịt), bạn sẽ khuyên người dùng sử dụng tính năng gì của Automa Vault (liên quan đến Browser Profiles / Cookies) để bypass bước đăng nhập?

**Câu 42: (Edge Case - Headless Detection)** Khi chạy workflow bằng CLI ở chế độ `--headless`, một số trang web chống bot (Cloudflare) sẽ chặn trình duyệt. Bạn có biết Automa hỗ trợ những cờ (flags) khởi tạo trình duyệt hoặc cơ chế stealth nào để bypass hệ thống nhận diện bot không?
